<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ProgrammerDetailsResource extends ProgrammerResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'atcoder_handle' => $this->atcoder_handle,
            'vjudge_handle' => $this->vjudge_handle,
            'trackers' => $this->whenLoaded('rankLists', function () {
                return $this->rankLists
                    ->groupBy('tracker_id')
                    ->map(function ($rankLists, $trackerId) {
                        $tracker = $rankLists->first()->tracker;

                        return [
                            'title' => $tracker?->title,
                            'slug' => $tracker?->slug,
                            'rank_lists' => $rankLists->map(function ($rankList) {
                                return [
                                    'keyword' => $rankList->keyword,
                                    'position' => $rankList->pivot?->position,
                                    'score' => $rankList->pivot?->score,
                                    'event_count' => $rankList->event_count ?? 0,
                                    'total_user_count' => $rankList->total_user_count ?? 0,
                                ];
                            })->values(),
                        ];
                    })
                    ->values();
            }),
            'contests' => $this->whenLoaded('teams', function () {
                return $this->teams
                    ->groupBy('contest_id')
                    ->map(function ($teams, $contestId) {
                        $contest = $teams->first()->contest;

                        return [
                            'name' => $contest?->name,
                            'contest_type' => $contest?->contest_type?->value,
                            'location' => $contest?->location,
                            'date' => $contest?->date?->toIso8601String(),
                            'standings_url' => $contest?->standings_url,
                            'teams' => $teams->map(function ($team) {
                                return [
                                    'name' => $team->name,
                                    'rank' => $team->rank,
                                    'solve_count' => $team->solve_count,
                                    'members' => PublicUserResource::collection($team->members),
                                ];
                            })->values(),
                        ];
                    })
                    ->values();
            }),
        ]);
    }
}
