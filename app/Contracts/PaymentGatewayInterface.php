<?php

namespace App\Contracts;

use App\Models\Payment;

interface PaymentGatewayInterface
{
    /**
     * Initialize a payment transaction
     *
     * @param  array  $data  Payment data including amount, currency, etc.
     * @return array Gateway response with payment URL and transaction details
     */
    public function initiatePayment(array $data): array;

    /**
     * Verify a payment transaction
     *
     * @param  string  $transactionId  The transaction ID to verify
     * @return array Verification response with status and details
     */
    public function verifyPayment(string $transactionId): array;

    /**
     * Process payment callback/webhook
     *
     * @param  array  $data  Callback data from gateway
     * @return array Processed callback response
     */
    public function handleCallback(array $data): array;

    /**
     * Refund a payment
     *
     * @param  Payment  $payment  The payment to refund
     * @param  float|null  $amount  Amount to refund (null for full refund)
     * @return array Refund response
     */
    public function refundPayment(Payment $payment, ?float $amount = null): array;

    /**
     * Get payment status
     *
     * @param  string  $transactionId  The transaction ID to check
     * @return string Payment status
     */
    public function getPaymentStatus(string $transactionId): string;

    /**
     * Get gateway name
     */
    public function getGatewayName(): string;
}
