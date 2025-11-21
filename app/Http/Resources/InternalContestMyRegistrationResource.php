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
        $paymentCheck = $this->canInitiateNewPayment();

        return [
            'id' => $this->id,
            'internal_contest' => [
                'title' => $this->internalContest->title,
                'slug' => $this->internalContest->slug,
                'semester' => $this->internalContest->semester,
                'registration_fee' => (float) $this->internalContest->registration_fee,
                'registration_deadline' => $this->internalContest->registration_deadline,
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
            'pickup_point' => $this->pickup_point,
            'status' => $this->getStatus(),
            'is_confirmed' => $this->isConfirmed(),
            'is_free' => $this->isFree(),
            'can_pay' => $paymentCheck['can_pay'],
            'payment' => $latestPayment ? [
                'status' => $latestPayment->status->value,
                'amount' => (float) $latestPayment->amount,
                'transaction_id' => $latestPayment->transaction_id,
                'paid_at' => $latestPayment->paid_at,
            ] : null,
            'payment_history' => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'status' => $payment->status->value,
                'amount' => (float) $payment->amount,
                'transaction_id' => $payment->transaction_id,
                'paid_at' => $payment->paid_at,
            ]),
            'registered_at' => $this->created_at,
        ];
    }
}
