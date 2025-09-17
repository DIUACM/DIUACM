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
        if ($request->routeIs('contests.index')) {
            return [
                'id' => $this->id,
                'name' => $this->name,
                'contest_type' => $this->contest_type->value,
                'location' => $this->location,
                'date' => $this->date?->toISOString(),
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'contest_type' => $this->contest_type->value,
            'location' => $this->location,
            'date' => $this->date?->toISOString(),
            'description' => $this->description,
            'standings_url' => $this->standings_url,
            'gallery' => new GalleryResource($this->gallery),
            'teams' => TeamResource::collection($this->teams),
        ];
    }
}
