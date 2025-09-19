<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('events.index')) {
            $data = [
                'id' => $this->id,
                'title' => $this->title,
                'starting_at' => $this->starting_at->toISOString(),
                'ending_at' => $this->ending_at->toISOString(),
                'participation_scope' => $this->participation_scope->value,
                'event_type' => $this->type->value,
            ];

            if ($this->open_for_attendance) {
                $data['attendance_count'] = $this->attendees_count;
            }

            return $data;
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'starting_at' => $this->starting_at->toISOString(),
            'ending_at' => $this->ending_at->toISOString(),
            'participation_scope' => $this->participation_scope->value,
            'event_link' => $this->event_link,
            'open_for_attendance' => $this->open_for_attendance,
            'user_stats' => $this->eventUserStats->map(function ($stat) {
                return array_merge(
                    (new UserResource($stat->user))->toArray(request()),
                    [
                        'solve_count' => $stat->solve_count,
                        'upsolve_count' => $stat->upsolve_count,
                        'participation' => $stat->participation,
                    ]
                );
            }),
            'attendees' => $this->when($this->open_for_attendance, function () {
                return $this->attendees->map(function ($attendee) {
                    return array_merge(
                        (new UserResource($attendee))->toArray(request()),
                        [
                            'attendance_time' => $attendee->pivot->created_at->toISOString(),
                        ]
                    );
                });
            }),
        ];
    }
}
