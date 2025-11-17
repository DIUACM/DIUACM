<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class TrackerDetailsResource extends TrackerResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'tracker' => [
                'title' => $this->title,
                'slug' => $this->slug,
            ],
            'selectedRankList' => $this->when(isset($this->selectedRankList), function () {
                $rankList = $this->selectedRankList;

                return [
                    'id' => $rankList->id,
                    'keyword' => $rankList->keyword,
                    'consider_strict_attendance' => $rankList->consider_strict_attendance,
                    'events' => $rankList->events->map(function ($event) {
                        return [
                            'id' => $event->id,
                            'title' => $event->title,
                            'starting_at' => $event->starting_at,
                            'strict_attendance' => $event->strict_attendance ?? null,
                        ];
                    }),
                    'users' => $rankList->users->map(function ($user) {
                        return array_merge(
                            (new PublicUserResource($user))->toArray(request()),
                            [
                                'score' => $user->pivot->score ?? 0,
                                'event_stats' => $user->getAttribute('event_stats'),
                            ]
                        );
                    }),
                ];
            }),
            'availableRankLists' => $this->when(isset($this->availableRankLists), function () {
                return $this->availableRankLists->map(function ($rankList) {
                    return [
                        'keyword' => $rankList->keyword,
                    ];
                });
            }),
        ];
    }
}
