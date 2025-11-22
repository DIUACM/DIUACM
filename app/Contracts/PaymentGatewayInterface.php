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
     * Process payment callback/webhook
     *
     * @param  array  $data  Callback data from gateway
     * @return array Processed callback response
     */
    public function handleCallback(array $data): array;

    /**
     * Get gateway name
     */
    public function getGatewayName(): string;
}
