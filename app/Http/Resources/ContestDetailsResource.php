<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ContestDetailsResource extends ContestResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'gallery' => $this->whenLoaded('gallery', fn () => (new GalleryDetailsResource($this->gallery))->toArray($request)),
            'teams' => $this->whenLoaded('teams', fn () => $this->teams->map(fn ($team) => [
                'id' => $team->id,
                'name' => $team->name,
                'rank' => $team->rank,
                'solve_count' => $team->solve_count,
                'members' => $team->members->map(fn ($member) => (new PublicUserResource($member))->toArray($request)),
            ])),
        ]);
    }
}
