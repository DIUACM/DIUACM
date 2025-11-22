<?php

namespace App\Traits;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasPayments
{
    /**
     * Get all payments for this model
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * Get the latest payment
     */
    public function latestPayment(): ?Payment
    {
        return $this->payments()->latest()->first();
    }

    /**
     * Get successful payments
     */
    public function successfulPayments(): MorphMany
    {
        return $this->payments()->where('status', PaymentStatus::PAID);
    }

    /**
     * Get pending payments
     */
    public function pendingPayments(): MorphMany
    {
        return $this->payments()->where('status', PaymentStatus::PENDING);
    }

    /**
     * Get payments under manual review
     */
    public function paymentsUnderManualReview(): MorphMany
    {
        return $this->payments()->where('status', PaymentStatus::UNDER_MANUAL_REVIEW);
    }

    /**
     * Check if has any successful payment
     */
    public function hasSuccessfulPayment(): bool
    {
        return $this->successfulPayments()->exists();
    }

    /**
     * Check if has pending payment
     */
    public function hasPendingPayment(): bool
    {
        return $this->pendingPayments()->exists();
    }

    /**
     * Check if has payment under manual review
     */
    public function hasPaymentUnderManualReview(): bool
    {
        return $this->paymentsUnderManualReview()->exists();
    }

    /**
     * Check if can initiate new payment
     * Returns false if there's already a successful payment, pending payment, or payment under review
     */
    public function canInitiatePayment(): bool
    {
        return ! ($this->hasSuccessfulPayment() || $this->hasPendingPayment() || $this->hasPaymentUnderManualReview());
    }

    /**
     * Check if a new payment can be initiated with detailed reason
     * Returns array with 'can_pay' boolean and 'reason' string
     */
    public function canInitiateNewPayment(): array
    {
        // Check if already has successful payment
        if ($this->hasSuccessfulPayment()) {
            return [
                'can_pay' => false,
                'reason' => 'payment_completed',
                'message' => 'Payment has already been completed',
            ];
        }

        // Check if has payment under manual review
        if ($this->hasPaymentUnderManualReview()) {
            return [
                'can_pay' => false,
                'reason' => 'under_review',
                'message' => 'Your payment is currently under manual review by our team. Please wait for verification.',
            ];
        }

        // Check if payment is required (for models that have this method)
        if (method_exists($this, 'isFree') && $this->isFree()) {
            return [
                'can_pay' => false,
                'reason' => 'no_payment_required',
                'message' => 'This registration does not require payment',
            ];
        }

        return [
            'can_pay' => true,
            'reason' => null,
            'message' => null,
        ];
    }

    /**
     * Get total paid amount
     */
    public function totalPaidAmount(): float
    {
        return (float) $this->successfulPayments()->sum('amount');
    }

    /**
     * Create a new payment record
     *
     * @param  string  $gateway  Gateway name (e.g., 'bkash', 'sslcommerz')
     * @param  float  $amount  Payment amount
     * @param  string  $currency  Currency code (default: 'BDT')
     * @param  array  $additionalData  Additional payment data
     */
    public function createPayment(
        string $gateway,
        float $amount,
        string $currency = 'BDT',
        array $additionalData = []
    ): Payment {
        return $this->payments()->create([
            'gateway' => $gateway,
            'amount' => $amount,
            'currency' => $currency,
            'status' => PaymentStatus::PENDING,
            'transaction_id' => $additionalData['transaction_id'] ?? $this->generateTransactionId(),
            'gateway_transaction_id' => $additionalData['gateway_transaction_id'] ?? null,
            'gateway_response' => $additionalData['gateway_response'] ?? null,
        ]);
    }

    /**
     * Mark payment as successful
     */
    public function markPaymentAsSuccessful(Payment $payment, array $gatewayResponse = []): bool
    {
        return $payment->update([
            'status' => PaymentStatus::PAID,
            'paid_at' => now(),
            'gateway_response' => array_merge($payment->gateway_response ?? [], $gatewayResponse),
        ]);
    }

    /**
     * Mark payment as failed
     */
    public function markPaymentAsFailed(Payment $payment, array $gatewayResponse = []): bool
    {
        return $payment->update([
            'status' => PaymentStatus::FAILED,
            'gateway_response' => array_merge($payment->gateway_response ?? [], $gatewayResponse),
        ]);
    }

    /**
     * Mark payment as cancelled
     */
    public function markPaymentAsCancelled(Payment $payment, array $gatewayResponse = []): bool
    {
        return $payment->update([
            'status' => PaymentStatus::CANCELED,
            'gateway_response' => array_merge($payment->gateway_response ?? [], $gatewayResponse),
        ]);
    }

    /**
     * Generate a unique transaction ID
     */
    protected function generateTransactionId(): string
    {
        return strtoupper(uniqid('TXN-', true));
    }
}
