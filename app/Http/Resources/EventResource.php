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
        return [
            'id' => $this->id,
            'title' => $this->title,
            'starting_at' => $this->starting_at,
            'ending_at' => $this->ending_at,
            'participation_scope' => $this->participation_scope,
            'type' => $this->type,
            'attendees_count' => $this->when($this->open_for_attendance, fn () => $this->whenCounted('attendees')),
        ];
    }
}
