<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgrammerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('galleries.index')) {

            return [
                ...new UserResource($this)->toArray($request),
                'max_cf_rating' => $this->max_cf_rating,
            ];
        }

        return [
            ...new UserResource($this)->toArray($request),
            'max_cf_rating' => $this->max_cf_rating,
            'codeforces_handle' => $this->codeforces_handle,
            'atcoder_handle' => $this->atcoder_handle,
            'vjudge_handle' => $this->vjudge_handle,
            'contests' => $this->teams->map(fn ($team) => [
                'id' => $team->contest->id,
                'name' => $team->contest->name,
                'date' => $team->contest->date->toISOString(),
                'team_name' => $team->name,
                'rank' => $team->rank,
                'solve_count' => $team->solve_count,
                'members' => UserResource::collection($team->members),
            ]),

        ];

    }
}
