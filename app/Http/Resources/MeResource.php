<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeResource extends JsonResource
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
            'email' => $this->email,
            'username' => $this->username,
            'gender' => $this->gender?->value,
            'phone' => $this->phone,
            'codeforces_handle' => $this->codeforces_handle,
            'atcoder_handle' => $this->atcoder_handle,
            'vjudge_handle' => $this->vjudge_handle,
            'department' => $this->department,
            'student_id' => $this->student_id,
            'max_cf_rating' => $this->max_cf_rating,
            'profile_picture' => $this->getFirstMediaUrl('profile_picture'),
        ];
    }
}
