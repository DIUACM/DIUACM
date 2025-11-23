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
                'gateway' => $latestPayment->gateway,
                'transaction_id' => $latestPayment->transaction_id,
                'paid_at' => $latestPayment->paid_at,
                'mfs_transaction' => $latestPayment->mfsManualTransaction ? [
                    'sender_number' => $latestPayment->mfsManualTransaction->sender_number,
                    'receiver_number' => $latestPayment->mfsManualTransaction->receiver_number,
                    'mfs_transaction_id' => $latestPayment->mfsManualTransaction->mfs_transaction_id,
                    'mfs_type' => $latestPayment->mfsManualTransaction->mfs_type->value,
                    'amount' => (float) $latestPayment->mfsManualTransaction->amount,
                ] : null,
            ] : null,
            'payment_history' => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'status' => $payment->status->value,
                'amount' => (float) $payment->amount,
                'gateway' => $payment->gateway,
                'transaction_id' => $payment->transaction_id,
                'paid_at' => $payment->paid_at,
                'mfs_transaction' => $payment->mfsManualTransaction ? [
                    'sender_number' => $payment->mfsManualTransaction->sender_number,
                    'receiver_number' => $payment->mfsManualTransaction->receiver_number,
                    'mfs_transaction_id' => $payment->mfsManualTransaction->mfs_transaction_id,
                    'mfs_type' => $payment->mfsManualTransaction->mfs_type->value,
                    'amount' => (float) $payment->mfsManualTransaction->amount,
                ] : null,
            ]),
            'registered_at' => $this->created_at,
        ];
    }
}
