<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InternalContestResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'registration_deadline' => $this->registration_deadline,
            'registration_start_time' => $this->registration_start_time,
            'registration_fee' => $this->registration_fee,
            'registration_limit' => $this->registration_limit,
            'banner_image' => $this->getFirstMediaUrl('banner_image'),
            'is_registration_open' => $this->isRegistrationOpen(),
            'registration_status' => $this->registrationStatus(),
        ];
    }
}
