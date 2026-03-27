<?php

namespace App\Models;

use App\Contracts\Payable;
use App\Enums\Gender;
use App\Traits\HasPayments;
use Database\Factories\InternalContestRegistrationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternalContestRegistration extends Model implements Payable
{
    /** @use HasFactory<InternalContestRegistrationFactory> */
    use HasFactory;

    use HasPayments;

    protected $fillable = [
        'internal_contest_id',
        'user_id',
        'name',
        'email',
        'student_id',
        'phone',
        'section',
        'department',
        'lab_teacher_name',
        'tshirt_size',
        'gender',
        'transport_service_required',
        'pickup_point',
    ];

    protected function casts(): array
    {
        return [
            'internal_contest_id' => 'integer',
            'user_id' => 'integer',
            'transport_service_required' => 'boolean',
            'gender' => Gender::class,
        ];
    }

    public function internalContest()
    {
        return $this->belongsTo(InternalContest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the registration is free (no payment required)
     */
    public function isFree(): bool
    {
        return $this->internalContest->registration_fee == 0;
    }

    /**
     * Check if the registration is confirmed
     * A registration is confirmed if it's free OR has a successful payment
     */
    public function isConfirmed(): bool
    {
        return $this->isFree() || $this->hasSuccessfulPayment();
    }

    /**
     * Check if the registration is pending confirmation
     */
    public function isPending(): bool
    {
        return ! $this->isConfirmed();
    }

    /**
     * Check if the registration has been canceled
     * A registration is canceled if it has a failed or canceled payment
     */
    public function isCanceled(): bool
    {
        $latestPayment = $this->latestPayment();

        return $latestPayment && in_array($latestPayment->status->value, ['failed', 'canceled']);
    }

    /**
     * Get the computed registration status based on payment state
     */
    public function getStatus(): string
    {
        if ($this->isConfirmed()) {
            return 'paid';
        }

        if ($this->hasPaymentUnderManualReview()) {
            return 'under_review';
        }

        if ($this->isCanceled()) {
            return 'canceled';
        }

        return 'pending';
    }

    /**
     * Handle successful payment for contest registration
     */
    public function onPaymentSuccessful(Payment $payment): void
    {
        // You can add additional logic here, such as:
        // - Sending confirmation email
        // - Creating user account if needed
        // - Triggering notifications
        // - Logging the event
    }

    /**
     * Handle failed payment for contest registration
     */
    public function onPaymentFailed(Payment $payment): void
    {
        // You can add additional logic here, such as:
        // - Sending failure notification
        // - Logging the failure
    }

    /**
     * Handle cancelled payment for contest registration
     */
    public function onPaymentCancelled(Payment $payment): void
    {
        // You can add additional logic here, such as:
        // - Sending cancellation notification
        // - Allowing user to retry payment
    }

    /**
     * Generate a unique and readable transaction ID for internal contest registration
     * Format: ICTR-{CONTEST_ID}-{DATE}-{UNIQUE}
     * Example: ICTR-5-20251120-A1B2C3
     */
    protected function generateTransactionId(): string
    {
        $contestId = $this->internal_contest_id ?? 'NEW';
        $date = now()->format('Ymd');
        $unique = strtoupper(substr(uniqid(), -6));

        return "ICTR-{$contestId}-{$date}-{$unique}";
    }
}
