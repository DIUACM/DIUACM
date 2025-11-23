<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContestTeamResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'rank' => $this->rank,
            'solve_count' => $this->solve_count,
            'members' => PublicUserResource::collection($this->members)->resolve(),
        ];
    }
}
