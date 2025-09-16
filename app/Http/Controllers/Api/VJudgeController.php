<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class VJudgeController extends Controller
{
    public function getActiveContests(): JsonResponse
    {
        // Fetch events that have 'vjudge.net' in the event_link and have active ranklists
        $activeContests = Event::select('id', 'title', 'event_link as eventLink', 'starting_at')
            ->where('event_link', 'like', '%vjudge.net%')
            ->whereHas('rankLists', function ($query) {
                $query->where('is_active', true);
            })
            ->orderBy('starting_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activeContests,
        ]);
    }

    public function processContestData(int $eventId): JsonResponse
    {
        $payload = request()->getContent();
        $payload = json_decode($payload, true);

        if (! $payload || ! is_array($payload)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid JSON payload',
            ], 400);
        }

        // Get event
        $event = Event::findOrFail($eventId);

        // Check if auto update score is enabled for this event
        if (! $event->auto_update_score) {
            return response()->json([
                'success' => false,
                'message' => 'Auto update score is disabled for this event',
            ], 400);
        }

        // Extract VJudge usernames from payload
        $vjudgeUsernames = [];
        if (isset($payload['participants']) && is_array($payload['participants'])) {
            foreach ($payload['participants'] as $participant) {
                if (isset($participant[0])) {
                    $vjudgeUsernames[] = $participant[0];
                }
            }
        }

        // Get users from ranklists associated with this event who have vjudge handles
        // OR users whose vjudge_handle match VJudge usernames in the payload
        $users = User::select('id', 'vjudge_handle', 'username')
            ->where(function ($query) use ($eventId, $vjudgeUsernames) {
                // Users from ranklists with vjudge handles
                $query->whereHas('rankLists', function ($subQuery) use ($eventId) {
                    $subQuery->whereHas('events', function ($nestedQuery) use ($eventId) {
                        $nestedQuery->where('events.id', $eventId);
                    });
                });

                // OR users whose vjudge_handle match VJudge usernames
                if (! empty($vjudgeUsernames)) {
                    $query->orWhere(function ($subQuery) use ($vjudgeUsernames) {
                        $subQuery->whereIn('vjudge_handle', $vjudgeUsernames)
                            ->whereNotNull('vjudge_handle');
                    });
                }
            })
            ->get();

        if ($users->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No users with VJudge handles found in the ranklists or matching VJudge usernames',
            ], 400);
        }

        // Process the VJudge data
        $processedData = $this->processVjudgeData($payload);

        // Delete existing solve stats for this event
        EventUserStat::where('event_id', $eventId)->delete();

        // Process users and prepare insert data
        $insertData = [];

        foreach ($users as $user) {
            // Only match by vjudge_handle
            $stats = $processedData[$user->vjudge_handle??"nousername"] ?? null;

            $finalSolveCount = $stats['solveCount'] ?? 0;
            $finalUpsolveCount = $stats['upSolveCount'] ?? 0;

            $insertData[] = [
                'user_id' => $user->id,
                'event_id' => $eventId,
                'solves_count' => $finalSolveCount,
                'upsolves_count' => $finalUpsolveCount,
                'participation' => ! ($stats['absent'] ?? true),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (! empty($insertData)) {
            EventUserStat::insert($insertData);
        }

        return response()->json([
            'success' => true,
            'message' => 'VJudge data processed and database updated successfully',
            'data' => $processedData,
        ]);
    }

    private function processVjudgeData(array $data): array
    {
        $timeLimit = $data['length'] / 1000;
        $processed = [];

        // Initialize user stats
        foreach ($data['participants'] as $participantId => $participant) {
            $username = $participant[0];
            $processed[$username] = [
                'solveCount' => 0,
                'upSolveCount' => 0,
                'absent' => true,
                'solved' => array_fill(0, 50, 0),
            ];
        }

        // Process submissions if they exist
        if (isset($data['submissions']) && is_array($data['submissions'])) {
            // First pass: Process in-time submissions
            foreach ($data['submissions'] as $submission) {
                [$participantId, $problemIndex, $isAccepted, $timestamp] = $submission;

                $participant = $data['participants'][$participantId] ?? null;
                if (! $participant) {
                    continue;
                }

                $username = $participant[0];
                if (! isset($processed[$username])) {
                    continue;
                }

                if ($timestamp > $timeLimit) {
                    continue;
                }

                $processed[$username]['absent'] = false;

                if ($isAccepted === 1 && ! $processed[$username]['solved'][$problemIndex]) {
                    $processed[$username]['solveCount']++;
                    $processed[$username]['solved'][$problemIndex] = 1;
                }
            }

            // Second pass: Process upsolve submissions
            foreach ($data['submissions'] as $submission) {
                [$participantId, $problemIndex, $isAccepted, $timestamp] = $submission;

                $participant = $data['participants'][$participantId] ?? null;
                if (! $participant) {
                    continue;
                }

                $username = $participant[0];
                if (! isset($processed[$username])) {
                    continue;
                }

                if ($isAccepted === 1 && $timestamp > $timeLimit && ! $processed[$username]['solved'][$problemIndex]) {
                    $processed[$username]['upSolveCount']++;
                    $processed[$username]['solved'][$problemIndex] = 1;
                }
            }
        }

        return $processed;
    }
}
