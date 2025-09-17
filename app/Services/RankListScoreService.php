<?php

namespace App\Services;

use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RankListScoreService
{
    /**
     * Recalculate scores for all active ranklists
     */
    public function recalculateAllActiveRankLists(): Collection
    {
        return RankList::where('is_active', true)->get();
    }

    /**
     * Recalculate scores for all ranklists (active and inactive)
     */
    public function recalculateAllRankLists(): Collection
    {
        return RankList::all();
    }

    /**
     * Get a specific ranklist by ID
     */
    public function getRankListById(int $rankListId): ?RankList
    {
        return RankList::find($rankListId);
    }

    /**
     * Recalculate scores for all users in a specific ranklist
     */
    public function recalculateScoresForRankList(RankList $rankList): array
    {
        // Get all events associated with this ranklist with eager loading
        $events = $rankList->events()->with('attendees')->get();

        if ($events->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No events found for this ranklist.',
                'processed_users' => 0,
            ];
        }

        // Get all users for this ranklist
        $users = $rankList->users;
        $userIds = $users->pluck('id')->toArray();

        // Get the weight of upsolve for this ranklist
        $weightOfUpsolve = $rankList->weight_of_upsolve;

        // Get all event IDs to efficiently fetch user stats in one query
        $eventIds = $events->pluck('id')->toArray();

        // Fetch all user solve stats for these users and events in one query
        $userStats = EventUserStat::whereIn('user_id', $userIds)
            ->whereIn('event_id', $eventIds)
            ->get()
            ->groupBy(function ($stat) {
                return $stat->user_id.'_'.$stat->event_id;
            });

        // Check if ranklist considers strict attendance
        $considerStrictAttendance = $rankList->consider_strict_attendance;

        // Create a map for quick attendance lookup
        $attendanceMap = [];
        if ($considerStrictAttendance) {
            foreach ($events as $event) {
                if ($event->strict_attendance) {
                    foreach ($event->attendees as $attendee) {
                        $attendanceMap[$attendee->id.'_'.$event->id] = true;
                    }
                }
            }
        }

        $userScores = [];

        foreach ($users as $user) {
            $totalScore = $this->calculateUserScore(
                $user,
                $events,
                $userStats,
                $weightOfUpsolve,
                $considerStrictAttendance,
                $attendanceMap
            );

            $userScores[] = [
                'rank_list_id' => $rankList->id,
                'user_id' => $user->id,
                'score' => $totalScore,
            ];
        }

        // Batch update all scores at once
        $this->updateUserScores($userScores);

        return [
            'success' => true,
            'message' => 'Successfully processed ranklist: '.$rankList->keyword,
            'processed_users' => count($userScores),
        ];
    }

    /**
     * Recalculate score for a specific user in a specific ranklist
     */
    public function recalculateScoreForUser(RankList $rankList, User $user): array
    {
        // Check if user is in this ranklist
        if (! $rankList->users()->where('user_id', $user->id)->exists()) {
            return [
                'success' => false,
                'message' => "User {$user->name} is not part of ranklist {$rankList->keyword}",
                'processed_users' => 0,
            ];
        }

        // Get all events associated with this ranklist with eager loading
        $events = $rankList->events()->with('attendees')->get();

        if ($events->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No events found for this ranklist.',
                'processed_users' => 0,
            ];
        }

        // Get the weight of upsolve for this ranklist
        $weightOfUpsolve = $rankList->weight_of_upsolve;

        // Get all event IDs to efficiently fetch user stats
        $eventIds = $events->pluck('id')->toArray();

        // Fetch user solve stats for this specific user and events
        $userStats = EventUserStat::where('user_id', $user->id)
            ->whereIn('event_id', $eventIds)
            ->get()
            ->groupBy(function ($stat) {
                return $stat->user_id.'_'.$stat->event_id;
            });

        // Check if ranklist considers strict attendance
        $considerStrictAttendance = $rankList->consider_strict_attendance;

        // Create a map for quick attendance lookup
        $attendanceMap = [];
        if ($considerStrictAttendance) {
            foreach ($events as $event) {
                if ($event->strict_attendance) {
                    foreach ($event->attendees as $attendee) {
                        $attendanceMap[$attendee->id.'_'.$event->id] = true;
                    }
                }
            }
        }

        $totalScore = $this->calculateUserScore(
            $user,
            $events,
            $userStats,
            $weightOfUpsolve,
            $considerStrictAttendance,
            $attendanceMap
        );

        $userScore = [
            'rank_list_id' => $rankList->id,
            'user_id' => $user->id,
            'score' => $totalScore,
        ];

        // Update the specific user's score
        $this->updateUserScores([$userScore]);

        return [
            'success' => true,
            'message' => "Successfully updated score for user {$user->name} in ranklist {$rankList->keyword}",
            'processed_users' => 1,
        ];
    }

    /**
     * Calculate score for a specific user
     */
    private function calculateUserScore(
        User $user,
        Collection $events,
        Collection $userStats,
        float $weightOfUpsolve,
        bool $considerStrictAttendance,
        array $attendanceMap
    ): float {
        $totalScore = 0;

        foreach ($events as $event) {
            $eventWeight = $event->pivot->weight;
            $userStatKey = $user->id.'_'.$event->id;

            // Get user solve stats from our pre-fetched collection
            $userStat = $userStats->get($userStatKey)?->first();

            if ($userStat) {
                // Check attendance status only if ranklist considers strict attendance
                $hasAttendance = ! $considerStrictAttendance ||
                                ! $event->strict_attendance ||
                                isset($attendanceMap[$user->id.'_'.$event->id]);

                if ($hasAttendance) {
                    // Regular calculation: solves_count * weight + upsolves_count * weight * weightOfUpsolve
                    $solveScore = $userStat->solves_count * $eventWeight;
                    $upsolveScore = $userStat->upsolves_count * $eventWeight * $weightOfUpsolve;
                } else {
                    // If strict attendance is enforced and user hasn't attended, treat all solves as upsolves
                    $solveScore = 0;
                    $upsolveScore = ($userStat->solves_count + $userStat->upsolves_count) * $eventWeight * $weightOfUpsolve;
                }

                $eventScore = $solveScore + $upsolveScore;
                $totalScore += $eventScore;
            }
        }

        return $totalScore;
    }

    /**
     * Batch update user scores in the database
     */
    private function updateUserScores(array $userScores): void
    {
        if (empty($userScores)) {
            return;
        }

        foreach ($userScores as $scoreData) {
            DB::table('rank_list_user')
                ->updateOrInsert(
                    [
                        'rank_list_id' => $scoreData['rank_list_id'],
                        'user_id' => $scoreData['user_id'],
                    ],
                    [
                        'score' => $scoreData['score'],
                    ]
                );
        }
    }

    /**
     * Get user by ID
     */
    public function getUserById(int $userId): ?User
    {
        return User::find($userId);
    }
}
