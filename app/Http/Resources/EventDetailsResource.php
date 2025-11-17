<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventDetailsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'starting_at' => $this->starting_at,
            'ending_at' => $this->ending_at,
            'participation_scope' => $this->participation_scope,
            'type' => $this->type,
            'attendees_count' => $this->whenCounted('attendees'),
            'event_link' => $this->event_link,
            'attendance' => $this->when($this->open_for_attendance && $this->relationLoaded('attendees'), function () {
                return $this->attendees->map(function ($user) {
                    return array_merge(
                        (new PublicUserResource($user))->toArray(request()),
                        ['attended_at' => $user->pivot->created_at]
                    );
                });
            }),
            'performance' => $this->when($this->type->value === 'contest' && $this->relationLoaded('usersWithStats'), function () {
                return $this->usersWithStats->map(function ($user) {
                    return array_merge(
                        (new PublicUserResource($user))->toArray(request()),
                        [
                            'solve_count' => $user->pivot->solve_count,
                            'upsolve_count' => $user->pivot->upsolve_count,
                        ]
                    );
                });
            }),
        ];
    }
}
