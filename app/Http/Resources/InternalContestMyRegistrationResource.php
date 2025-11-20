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
        $registrationStatus = $this->getStatus();
        $hasFee = $this->internalContest->registration_fee > 0;

        return [
            'id' => $this->id,
            'internal_contest' => [
                'id' => $this->internalContest->id,
                'title' => $this->internalContest->title,
                'slug' => $this->internalContest->slug,
                'semester' => $this->internalContest->semester,
                'description' => $this->internalContest->description,
                'registration_fee' => (float) $this->internalContest->registration_fee,
                'registration_deadline' => $this->internalContest->registration_deadline,
                'registration_start_time' => $this->internalContest->registration_start_time,
                'banner_image' => $this->internalContest->getFirstMediaUrl('banner_image'),
            ],
            'student_id' => $this->student_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'department' => $this->department,
            'section' => $this->section,
            'lab_teacher_name' => $this->lab_teacher_name,
            'tshirt_size' => $this->tshirt_size,
            'gender' => $this->gender->value,
            'transport_service_required' => $this->transport_service_required,
            'pickup_point' => $this->pickup_point,
            'status' => $registrationStatus,
            'is_confirmed' => $this->isConfirmed(),
            'is_free' => $this->isFree(),
            'payment' => $latestPayment ? [
                'id' => $latestPayment->id,
                'status' => $latestPayment->status->value,
                'amount' => (float) $latestPayment->amount,
                'currency' => $latestPayment->currency,
                'gateway' => $latestPayment->gateway,
                'transaction_id' => $latestPayment->transaction_id,
                'gateway_transaction_id' => $latestPayment->gateway_transaction_id,
                'paid_at' => $latestPayment->paid_at,
                'created_at' => $latestPayment->created_at,
            ] : null,
            'payment_history' => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'status' => $payment->status->value,
                'amount' => (float) $payment->amount,
                'gateway' => $payment->gateway,
                'transaction_id' => $payment->transaction_id,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
            ]),
            'registered_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
