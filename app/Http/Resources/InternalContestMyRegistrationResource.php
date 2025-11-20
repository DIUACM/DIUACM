<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InternalContestMyRegistrationResource extends JsonResource
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
            'internal_contest' => [
                'title' => $this->internalContest->title,
                'slug' => $this->internalContest->slug,
                'registration_fee' => (float) $this->internalContest->registration_fee,
            ],
            'student_id' => $this->student_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'department' => $this->department,
            'section' => $this->section,
            'lab_teacher_name' => $this->lab_teacher_name,
            'tshirt_size' => $this->tshirt_size,
            'gender' => $this->gender,
            'transport_service_required' => $this->transport_service_required,
            'pickup_point' => $this->pickup_point,
            'payment_status' => $this->payment_status,
            'created_at' => $this->created_at,
        ];
    }
}
