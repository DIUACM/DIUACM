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
                'participation_scope' => $this->participation_scope->getLabel(),
                'event_type' => $this->type->getLabel(),
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
            'type' => $this->type->getLabel(),
            'status' => $this->status->getLabel(),
            'starting_at' => $this->starting_at->toISOString(),
            'ending_at' => $this->ending_at->toISOString(),
            'participation_scope' => $this->participation_scope->getLabel(),
            'event_link' => $this->event_link,
            'open_for_attendance' => $this->open_for_attendance,
            'user_stats' => $this->eventUserStats->map(function ($stat) {
                return [
                    'user_name' => $stat->user->name,
                    'username' => $stat->user->username,
                    'student_id' => $stat->user->student_id,
                    'department' => $stat->user->department,
                    'profile_picture' => $stat->user->getFirstMediaUrl('profile_picture'),
                    'solves_count' => $stat->solves_count,
                    'upsolves_count' => $stat->upsolves_count,
                    'participation' => $stat->participation,
                ];
            }),
        ];
    }
}
