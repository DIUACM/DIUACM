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
        return array_merge(parent::toArray($request), [
            'selected_rank_list' => [
                'keyword' => $this->selectedRankList->keyword,
                'consider_strict_attendance' => $this->selectedRankList->consider_strict_attendance,
                'events' => $this->selectedRankList->events->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'starting_at' => $event->starting_at,
                        'strict_attendance' => $event->strict_attendance ?? null,
                        'weight' => $event->pivot->weight ?? null,
                    ];
                }),
                'users' => $this->selectedRankList->users->map(function ($user) {
                    return array_merge(
                        (new PublicUserResource($user))->toArray(request()),
                        [
                            'score' => $user->pivot->score ?? 0,
                            'position' => $user->pivot->position ?? 0,
                            'event_stats' => $user->getAttribute('event_stats'),
                        ]
                    );
                }),
            ],
            'available_rank_lists' => $this->availableRankLists->map(function ($rankList) {
                return [
                    'keyword' => $rankList->keyword,
                ];
            }),
        ]);
    }
}
