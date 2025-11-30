<?php

namespace App\Services;

use App\Contracts\Payable;
use App\Contracts\PaymentGatewayInterface;
use App\Models\Payment;
use App\Services\PaymentGateways\SslCommerzGateway;

class PaymentService
{
    protected array $gateways = [];

    public function __construct()
    {
        $this->registerGateways();
    }

    /**
     * Register available payment gateways
     */
    protected function registerGateways(): void
    {
        // $this->gateways['bkash'] = app(BkashGateway::class);
        $this->gateways['sslcommerz'] = app(SslCommerzGateway::class);
    }

    /**
     * Get a payment gateway instance
     */
    public function gateway(string $name): PaymentGatewayInterface
    {
        if (! isset($this->gateways[$name])) {
            throw new \InvalidArgumentException("Payment gateway '{$name}' not found.");
        }

        return $this->gateways[$name];
    }

    /**
     * Initiate a payment for a model
     *
     * @param  Payable  $model  Model that implements Payable interface
     * @param  string  $gateway  Gateway name (e.g., 'sslcommerz')
     * @param  float  $amount  Payment amount
     * @param  array  $additionalData  Additional payment data
     */
    public function initiatePayment(
        Payable $model,
        string $gateway,
        float $amount,
        array $additionalData = []
    ): array {
        // Create payment record
        $payment = $model->createPayment($gateway, $amount, $additionalData['currency'] ?? 'BDT', [
            'transaction_id' => $additionalData['transaction_id'] ?? null,
        ]);

        // Initiate payment with gateway
        $gatewayInstance = $this->gateway($gateway);
        $result = $gatewayInstance->initiatePayment(array_merge($additionalData, [
            'amount' => $amount,
            'transaction_id' => $payment->transaction_id,
        ]));

        // Update payment with gateway response
        if ($result['success']) {
            $payment->update([
                'gateway_transaction_id' => $result['payment_id'] ?? null,
                'gateway_response' => [
                    'initiation_response' => $result['response'] ?? null,
                ],
            ]);

            return [
                'success' => true,
                'payment' => $payment,
                'payment_url' => $result['payment_url'],
                'payment_id' => $result['payment_id'] ?? null,
            ];
        }

        // Mark payment as failed
        $model->markPaymentAsFailed($payment, $result['response'] ?? []);

        return [
            'success' => false,
            'payment' => $payment,
            'message' => $result['message'] ?? 'Payment initiation failed',
        ];
    }

    /**
     * Handle payment callback
     */
    public function handleCallback(string $gateway, array $data): array
    {
        $gatewayInstance = $this->gateway($gateway);

        return $gatewayInstance->handleCallback($data);
    }

    /**
     * Get all available gateways
     */
    public function availableGateways(): array
    {
        return array_keys($this->gateways);
    }
}
