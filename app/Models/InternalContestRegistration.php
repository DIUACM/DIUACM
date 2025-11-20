<?php

namespace App\Models;

use App\Contracts\Payable;
use App\Enums\Gender;
use App\Enums\RegistrationStatus;
use App\Traits\HasPayments;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternalContestRegistration extends Model implements Payable
{
    /** @use HasFactory<\Database\Factories\InternalContestRegistrationFactory> */
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
        'status',
    ];

    protected function casts(): array
    {
        return [
            'transport_service_required' => 'boolean',
            'gender' => Gender::class,
            'status' => RegistrationStatus::class,
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
     * Handle successful payment for contest registration
     */
    public function onPaymentSuccessful(Payment $payment): void
    {
        // Update registration status to paid
        $this->update([
            'status' => RegistrationStatus::PAID,
        ]);

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
        // Update registration status to canceled
        $this->update([
            'status' => RegistrationStatus::CANCELED,
        ]);

        // You can add additional logic here, such as:
        // - Sending failure notification
        // - Logging the failure
    }

    /**
     * Handle cancelled payment for contest registration
     */
    public function onPaymentCancelled(Payment $payment): void
    {
        // Update registration status to pending
        $this->update([
            'status' => RegistrationStatus::PENDING,
        ]);

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
