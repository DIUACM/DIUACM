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
            'data' => $activeContests,
        ]);
    }

    public function processContestData(int $eventId): JsonResponse
    {
        if (request()->user()->email !== 'sourov2305101004@diu.edu.bd') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = request()->getContent();
        $payload = json_decode($payload, true);

        if (! $payload || ! is_array($payload)) {
            return response()->json([
                'message' => 'Invalid JSON payload',
            ], 400);
        }

        if (! is_numeric($payload['length'] ?? null) || ! is_array($payload['participants'] ?? null)) {
            return response()->json([
                'message' => 'Invalid VJudge contest payload',
            ], 422);
        }

        // Get event
        $event = Event::findOrFail($eventId);

        // Get all users who have a VJudge handle
        $users = User::query()
            ->whereNotNull('vjudge_handle')
            ->where('vjudge_handle', '!=', '')
            ->get(['id', 'name', 'vjudge_handle']);

        if ($users->isEmpty()) {
            return response()->json([
                'message' => 'No users with VJudge handles found',
            ], 400);
        }

        // Process the VJudge data
        $processedData = $this->processVjudgeData($payload, $event->consider_partial_accept);

        if ($processedData === []) {
            return response()->json([
                'message' => 'No valid VJudge participants found in payload',
            ], 422);
        }

        // Delete existing solve stats for this event
        EventUserStat::where('event_id', $eventId)->delete();

        // Process each user and only create stats if we found data for them
        foreach ($users as $user) {
            $stats = $processedData[$user->vjudge_handle] ?? null;

            // Skip users with no data in the payload
            if ($stats === null) {
                continue;
            }

            EventUserStat::create([
                'user_id' => $user->id,
                'event_id' => $eventId,
                'solve_count' => $stats['solveCount'] ?? 0,
                'upsolve_count' => $stats['upSolveCount'] ?? 0,
                'participation' => ! ($stats['absent'] ?? true),
            ]);
        }

        return response()->json([
            'message' => 'VJudge data processed and database updated successfully',
            'processed_users' => count(array_filter($users->pluck('vjudge_handle')->toArray(), fn ($handle) => isset($processedData[$handle]))),
        ]);
    }

    private function processVjudgeData(array $data, bool $considerPartialAccept = true): array
    {
        $timeLimit = $data['length'] / 1000;
        $processed = [];

        // Initialize user stats
        foreach ($data['participants'] as $participantId => $participant) {
            $username = $this->participantUsername($participant);
            if ($username === null) {
                continue;
            }

            $processed[$username] = [
                'solveCount' => 0,
                'upSolveCount' => 0,
                'absent' => true,
                'solved' => [],
            ];
        }

        // Process submissions if they exist
        if (isset($data['submissions']) && is_array($data['submissions'])) {
            // First pass: Process in-time submissions
            foreach ($data['submissions'] as $submission) {
                if (! is_array($submission) || count($submission) < 4) {
                    continue;
                }

                [$participantId, $problemIndex, $isAccepted, $timestamp] = $submission;

                if (! is_numeric($problemIndex) || ! is_numeric($timestamp)) {
                    continue;
                }

                $problemIndex = (int) $problemIndex;
                $timestamp = (float) $timestamp;

                // Handle partial acceptance when consider_partial_accept is false
                $actuallyAccepted = $isAccepted === 1;
                if (! $considerPartialAccept && count($submission) >= 6) {
                    $userScore = $submission[4] ?? 0;
                    $maxScore = $submission[5] ?? 100;
                    // Only consider as accepted if user got full points
                    $actuallyAccepted = $isAccepted === 1 && $userScore >= $maxScore;
                }

                $participant = $data['participants'][$participantId] ?? null;
                if (! $participant) {
                    continue;
                }

                $username = $this->participantUsername($participant);
                if (! isset($processed[$username])) {
                    continue;
                }

                if ($timestamp > $timeLimit) {
                    continue;
                }

                $processed[$username]['absent'] = false;

                if ($actuallyAccepted && ! ($processed[$username]['solved'][$problemIndex] ?? false)) {
                    $processed[$username]['solveCount']++;
                    $processed[$username]['solved'][$problemIndex] = 1;
                }
            }

            // Second pass: Process upsolve submissions
            foreach ($data['submissions'] as $submission) {
                if (! is_array($submission) || count($submission) < 4) {
                    continue;
                }

                [$participantId, $problemIndex, $isAccepted, $timestamp] = $submission;

                if (! is_numeric($problemIndex) || ! is_numeric($timestamp)) {
                    continue;
                }

                $problemIndex = (int) $problemIndex;
                $timestamp = (float) $timestamp;

                // Handle partial acceptance when consider_partial_accept is false
                $actuallyAccepted = $isAccepted === 1;
                if (! $considerPartialAccept && count($submission) >= 6) {
                    $userScore = $submission[4] ?? 0;
                    $maxScore = $submission[5] ?? 100;
                    // Only consider as accepted if user got full points
                    $actuallyAccepted = $isAccepted === 1 && $userScore >= $maxScore;
                }

                $participant = $data['participants'][$participantId] ?? null;
                if (! $participant) {
                    continue;
                }

                $username = $this->participantUsername($participant);
                if (! isset($processed[$username])) {
                    continue;
                }

                if ($actuallyAccepted && $timestamp > $timeLimit && ! ($processed[$username]['solved'][$problemIndex] ?? false)) {
                    $processed[$username]['upSolveCount']++;
                    $processed[$username]['solved'][$problemIndex] = 1;
                }
            }
        }

        return $processed;
    }

    private function participantUsername(mixed $participant): ?string
    {
        if (! is_array($participant)) {
            return null;
        }

        $username = $participant['name'] ?? $participant[0] ?? null;

        return is_string($username) && trim($username) !== ''
            ? trim($username)
            : null;
    }
}
