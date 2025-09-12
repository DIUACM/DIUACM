<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessVJudgeDataRequest;
use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class VJudgeController extends Controller
{
    public function getActiveContests(): JsonResponse
    {
        try {
            // Fetch events that have 'vjudge.net' in the event_link and have active ranklists
            $activeContests = Event::select('events.id', 'events.title', 'events.event_link as eventLink')
                ->join('event_rank_list', 'events.id', '=', 'event_rank_list.event_id')
                ->join('rank_lists', 'event_rank_list.rank_list_id', '=', 'rank_lists.id')
                ->where('events.event_link', 'like', '%vjudge.net%')
                ->where('rank_lists.is_active', true)
                ->distinct()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeContests,
            ], 200);
        } catch (\Exception $error) {
            Log::error('Error fetching active contests:', ['error' => $error->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active contests',
            ], 500);
        }
    }

    public function processContestData(int $eventId): JsonResponse
    {
        try {
            $payload = request()->getContent();
            $payload = json_decode($payload, true);
            if (! $payload || ! is_array($payload)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid JSON payload',
                ], 400);
            }

            // Get event with strict_attendance setting
            $event = Event::select('id', 'strict_attendance')
                ->where('id', $eventId)
                ->first();

            if (! $event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event not found',
                ], 404);
            }

            // Get attendances for this event if strict attendance is enabled
            $attendeeUserIds = [];
            if ($event->strict_attendance) {
                $attendeeUserIds = DB::table('event_attendance')
                    ->where('event_id', $eventId)
                    ->pluck('user_id')
                    ->toArray();
            }

            // Get ranklists associated with this event
            $rankListIds = DB::table('event_rank_list')
                ->where('event_id', $eventId)
                ->pluck('rank_list_id')
                ->toArray();

            if (empty($rankListIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No ranklists found for this event',
                ], 400);
            }

            // Get users from ranklists with their vjudge handles
            $users = User::select('id', 'vjudge_handle', 'username')
                ->whereIn('id', function ($query) use ($rankListIds) {
                    $query->select('user_id')
                        ->from('rank_list_user')
                        ->whereIn('rank_list_id', $rankListIds);
                })
                ->whereNotNull('vjudge_handle')
                ->get();

            if ($users->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No users with VJudge handles found in the ranklists',
                ], 400);
            }

            // Process the VJudge data
            $processedData = $this->processVjudgeData($payload);

            // Delete existing solve stats for this event
            EventUserStat::where('event_id', $eventId)->delete();

            // Process users in chunks to avoid memory issues
            $insertData = [];

            foreach ($users as $user) {
                $stats = $processedData[$user->vjudge_handle] ?? null;

                $finalSolveCount = $stats['solveCount'] ?? 0;
                $finalUpsolveCount = $stats['upSolveCount'] ?? 0;

                // If strict attendance is enabled and user is not in attendees
                if ($event->strict_attendance && ! in_array($user->id, $attendeeUserIds)) {
                    $finalUpsolveCount += $finalSolveCount; // Move solves to upsolves
                    $finalSolveCount = 0;
                }

                $insertData[] = [
                    'user_id' => $user->id,
                    'event_id' => $eventId,
                    'solves_count' => $finalSolveCount,
                    'upsolves_count' => $finalUpsolveCount,
                    'participation' => $event->strict_attendance
                        ? in_array($user->id, $attendeeUserIds)
                        : ! ($stats['absent'] ?? true),
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
            ], 200);
        } catch (\Exception $error) {
            Log::error('Error processing VJudge data:', [
                'error' => $error->getMessage(),
                'trace' => $error->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process VJudge data',
                'error' => $error->getMessage(),
            ], 500);
        }
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
