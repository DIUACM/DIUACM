<?php

namespace App\Contracts;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Interface for models that can receive payments
 *
 * Models implementing this interface must define what happens
 * when payments succeed, fail, or are cancelled.
 */
interface Payable
{
    /**
     * Get all payments for this model
     */
    public function payments(): MorphMany;

    /**
     * Create a new payment record
     *
     * @param  string  $gateway  Gateway name (e.g., 'sslcommerz')
     * @param  float  $amount  Payment amount
     * @param  string  $currency  Currency code (default: 'BDT')
     * @param  array  $additionalData  Additional payment data
     */
    public function createPayment(
        string $gateway,
        float $amount,
        string $currency = 'BDT',
        array $additionalData = []
    ): Payment;

    /**
     * Mark payment as successful
     */
    public function markPaymentAsSuccessful(Payment $payment, array $gatewayResponse = []): bool;

    /**
     * Mark payment as failed
     */
    public function markPaymentAsFailed(Payment $payment, array $gatewayResponse = []): bool;

    /**
     * Mark payment as cancelled
     */
    public function markPaymentAsCancelled(Payment $payment, array $gatewayResponse = []): bool;

    /**
     * Handle successful payment
     *
     * This method is called when a payment is successfully processed.
     * Implement your business logic here (e.g., update status, send emails, create resources).
     *
     * @param  Payment  $payment  The successful payment
     */
    public function onPaymentSuccessful(Payment $payment): void;

    /**
     * Handle failed payment
     *
     * This method is called when a payment fails.
     * Implement your business logic here (e.g., update status, send notifications).
     *
     * @param  Payment  $payment  The failed payment
     */
    public function onPaymentFailed(Payment $payment): void;

    /**
     * Handle cancelled payment
     *
     * This method is called when a payment is cancelled by the user.
     * Implement your business logic here (e.g., reset status, allow retry).
     *
     * @param  Payment  $payment  The cancelled payment
     */
    public function onPaymentCancelled(Payment $payment): void;
}
