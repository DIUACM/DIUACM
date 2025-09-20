<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgrammerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('programmers.index')) {
            return array_merge(
                (new PublicUserResource($this))->toArray($request),
                [
                    'max_cf_rating' => $this->max_cf_rating,
                ]
            );
        }

        return array_merge(
            (new PublicUserResource($this))->toArray($request),
            [
                'max_cf_rating' => $this->max_cf_rating,
                'codeforces_handle' => $this->codeforces_handle,
                'atcoder_handle' => $this->atcoder_handle,
                'vjudge_handle' => $this->vjudge_handle,
                'contests' => $this->teams->map(fn ($team) => [
                    'id' => $team->contest->id,
                    'name' => $team->contest->name,
                    'date' => $team->contest->date->toISOString(),
                    'team_name' => $team->name,
                    'rank' => $team->rank,
                    'solve_count' => $team->solve_count,
                    'members' => PublicUserResource::collection($team->members),
                ]),
                'tracker_performance' => $this->formatTrackerPerformance(),
            ]
        );
    }

    /**
     * Format tracker performance data for the response.
     */
    private function formatTrackerPerformance(): array
    {
        // Group ranklists by tracker
        $trackerGroups = [];

        foreach ($this->rankLists as $rankList) {
            $trackerId = $rankList->tracker->id;

            if (! isset($trackerGroups[$trackerId])) {
                $trackerGroups[$trackerId] = [
                    'title' => $rankList->tracker->title,
                    'slug' => $rankList->tracker->slug,
                    'ranklists' => [],
                ];
            }

            // Get total users count for this ranklist
            $totalUsers = $rankList->users()->count();

            // Get user's position in this ranklist by counting users with higher scores
            $userScore = $rankList->pivot->score ?? 0;
            $userPosition = $rankList->users()
                ->where('rank_list_user.score', '>', $userScore)
                ->count() + 1;

            // Get events count for this ranklist
            $eventsCount = $rankList->events()->count();

            $trackerGroups[$trackerId]['ranklists'][] = [
                'keyword' => $rankList->keyword,
                'total_users' => $totalUsers,
                'events_count' => $eventsCount,
                'user_score' => $userScore,
                'user_position' => $userPosition,
            ];
        }

        // Return as array of trackers (not keyed by ID)
        return array_values($trackerGroups);
    }
}
