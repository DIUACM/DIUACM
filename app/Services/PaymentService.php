<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\PaymentGateways\SslCommerzGateway;
use Illuminate\Database\Eloquent\Model;

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
     * @param  Model  $model  Model that uses HasPayments trait
     * @param  string  $gateway  Gateway name (e.g., 'bkash')
     * @param  float  $amount  Payment amount
     * @param  array  $additionalData  Additional payment data
     */
    public function initiatePayment(
        Model $model,
        string $gateway,
        float $amount,
        array $additionalData = []
    ): array {
        // Create payment record
        $payment = $model->createPayment($gateway, $amount, $additionalData['currency'] ?? 'BDT', [
            'transaction_id' => $additionalData['invoice_number'] ?? null,
        ]);

        // Initiate payment with gateway
        $gatewayInstance = $this->gateway($gateway);
        $result = $gatewayInstance->initiatePayment(array_merge($additionalData, [
            'amount' => $amount,
            'invoice_number' => $payment->transaction_id,
        ]));

        // Update payment with gateway response
        if ($result['success']) {
            $payment->update([
                'gateway_transaction_id' => $result['payment_id'] ?? null,
                'gateway_response' => $result['response'] ?? null,
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
     * Verify and complete a payment
     */
    public function verifyPayment(Payment $payment): array
    {
        $gatewayInstance = $this->gateway($payment->gateway);
        $result = $gatewayInstance->verifyPayment($payment->gateway_transaction_id);

        if ($result['success'] && $result['status'] === 'Completed') {
            $payment->payable->markPaymentAsSuccessful($payment, [
                'gateway_transaction_id' => $result['transaction_id'] ?? $payment->gateway_transaction_id,
                'verification_response' => $result['response'] ?? null,
            ]);

            return [
                'success' => true,
                'payment' => $payment->fresh(),
                'message' => 'Payment verified successfully',
            ];
        }

        $payment->payable->markPaymentAsFailed($payment, [
            'verification_response' => $result['response'] ?? null,
        ]);

        return [
            'success' => false,
            'payment' => $payment->fresh(),
            'message' => $result['message'] ?? 'Payment verification failed',
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
     * Refund a payment
     */
    public function refundPayment(Payment $payment, ?float $amount = null): array
    {
        if ($payment->status !== PaymentStatus::PAID) {
            return [
                'success' => false,
                'message' => 'Only successful payments can be refunded',
            ];
        }

        $gatewayInstance = $this->gateway($payment->gateway);
        $result = $gatewayInstance->refundPayment($payment, $amount);

        if ($result['success']) {
            $payment->update([
                'status' => PaymentStatus::REFUNDED,
                'gateway_response' => array_merge($payment->gateway_response ?? [], [
                    'refund_response' => $result['response'] ?? null,
                ]),
            ]);

            return [
                'success' => true,
                'payment' => $payment->fresh(),
                'message' => 'Payment refunded successfully',
            ];
        }

        return [
            'success' => false,
            'payment' => $payment,
            'message' => $result['message'] ?? 'Refund failed',
        ];
    }

    /**
     * Check payment status
     */
    public function checkPaymentStatus(Payment $payment): string
    {
        $gatewayInstance = $this->gateway($payment->gateway);

        return $gatewayInstance->getPaymentStatus($payment->gateway_transaction_id);
    }

    /**
     * Get all available gateways
     */
    public function availableGateways(): array
    {
        return array_keys($this->gateways);
    }
}
