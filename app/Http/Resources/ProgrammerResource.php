<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ProgrammerResource extends PublicUserResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'max_cf_rating' => $this->max_cf_rating,
        ]);
    }
}
