<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('trackers.index')) {
            return [
                'title' => $this->title,
                'slug' => $this->slug,
                'description' => $this->description,
            ];
        }

        $selectedRankList = $this->selectedRankList;

        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'rank_lists' => $this->rankLists->map(function ($rankList) {
                return [
                    'keyword' => $rankList->keyword,
                ];
            }),
            'selected_rank_list' => [
                'keyword' => $selectedRankList->keyword,
                'consider_strict_attendance' => $selectedRankList->consider_strict_attendance,
                'events' => $selectedRankList->events->map(function ($event) use ($selectedRankList) {
                    $eventData = [
                        'id' => $event->id,
                        'title' => $event->title,
                        'starting_at' => $event->starting_at,
                    ];

                    if ($selectedRankList->consider_strict_attendance) {
                        $eventData['strict_attendance'] = $event->strict_attendance;
                    }

                    return $eventData;
                }),
                'users' => $selectedRankList->users->map(function ($user) {

                    return array_merge(
                        (new UserResource($user))->toArray(request()),
                        [
                            'score' => $user->pivot->score,
                            'event_stats' => $user->getAttribute('event_stats'),
                        ]
                    );

                }),
            ],
        ];
    }
}
