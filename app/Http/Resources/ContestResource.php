<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContestResource extends JsonResource
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
            'name' => $this->name,
            'contest_type' => $this->contest_type,
            'location' => $this->location,
            'date' => $this->date,
            'description' => $this->description,
            'standings_url' => $this->standings_url,
            'teams_count' => $this->whenCounted('teams'),
        ];
    }
}
