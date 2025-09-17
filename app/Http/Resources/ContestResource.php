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
            'teams' => $this->when($this->relationLoaded('teams'), $this->teams->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'rank' => $team->rank,
                    'solve_count' => $team->solve_count,
                    'members' => $team->relationLoaded('members') ? $team->members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'username' => $member->username,
                            'student_id' => $member->student_id,
                            'department' => $member->department,
                            'profile_picture' => $member->getFirstMediaUrl('profile_picture'),
                        ];
                    }) : [],
                ];
            })),
        ];
    }
}
