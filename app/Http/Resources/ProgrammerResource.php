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
        return [
            'name' => $this->name,
            'username' => $this->username,
            'student_id' => $this->student_id,
            'department' => $this->department,
            'max_cf_rating' => $this->max_cf_rating,
            'codeforces_handle' => $this->codeforces_handle,
            'avatar' => $this->avatar_url,
        ];
    }
}
