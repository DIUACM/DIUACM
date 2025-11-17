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
        // Group ranklists by tracker and format data
        $trackerPerformance = $this->rankLists
            ->groupBy('tracker_id')
            ->map(function ($rankLists) {
                $tracker = $rankLists->first()->tracker;

                return [
                    'slug' => $tracker->slug,
                    'title' => $tracker->title,
                    'ranklists' => $rankLists->map(function ($rankList) {
                        $users = $rankList->users;
                        $userPosition = null;
                        $userScore = 0;

                        foreach ($users as $index => $user) {
                            if ($user->id === $this->id) {
                                $userPosition = $index + 1;
                                $userScore = $user->pivot->score;
                                break;
                            }
                        }

                        return [
                            'keyword' => $rankList->keyword,
                            'user_position' => $userPosition,
                            'user_score' => $userScore,
                            'total_users' => $users->count(),
                            'events_count' => $rankList->events->count(),
                        ];
                    })->values(),
                ];
            })
            ->values();

        // Format contests with team members
        $contests = $this->teams->map(function ($team) {
            return [
                'name' => $team->contest->name,
                'date' => $team->contest->date?->format('Y-m-d H:i:s'),
                'team_name' => $team->name,
                'rank' => $team->rank,
                'solve_count' => $team->solve_count,
                'members' => $team->members->map(function ($member) {
                    return (new PublicUserResource($member))->toArray(request());
                }),
            ];
        });

        return array_merge(parent::toArray($request), [
            'atcoder_handle' => $this->atcoder_handle,
            'vjudge_handle' => $this->vjudge_handle,
            'tracker_performance' => $trackerPerformance,
            'contests' => $contests,
        ]);
    }
}
