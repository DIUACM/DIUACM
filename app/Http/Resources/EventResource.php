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
                'starting_at' => $this->starting_at?->toISOString(),
                'ending_at' => $this->ending_at?->toISOString(),
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
            'starting_at' => $this->starting_at?->toISOString(),
            'ending_at' => $this->ending_at?->toISOString(),
            'participation_scope' => $this->participation_scope->value,
            'event_link' => $this->event_link,
            'open_for_attendance' => $this->open_for_attendance,
            'strict_attendance' => $this->strict_attendance,
            'auto_update_score' => $this->auto_update_score,
            'is_attendance_window_enabled' => $this->isAttendanceWindowEnabled(),
        ];
    }
}
