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
        $latestPayment = $this->payments->first();

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
            'status' => $this->getStatus(),
            'payment_status' => $latestPayment?->status?->value,
            'payment_amount' => $latestPayment ? (float) $latestPayment->amount : null,
            'payment_gateway' => $latestPayment?->gateway,
            'payment_transaction_id' => $latestPayment?->transaction_id,
            'created_at' => $this->created_at,
        ];
    }
}
