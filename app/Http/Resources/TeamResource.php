<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
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
            'rank' => $this->rank,
            'solve_count' => $this->solve_count,
            'members' => $this->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'username' => $member->username,
                    'student_id' => $member->student_id,
                    'department' => $member->department,
                    'profile_picture' => $member->getFirstMediaUrl('profile_picture'),
                ];
            }),
        ];
    }
}
