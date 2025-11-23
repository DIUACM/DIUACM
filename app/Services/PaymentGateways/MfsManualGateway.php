<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGatewayInterface;

class MfsManualGateway implements PaymentGatewayInterface
{
    public function getGatewayName(): string
    {
        return 'mfs_manual';
    }

    public function initiatePayment(array $data): array
    {
        // For internal gateway, we don't redirect to external site
        // Instead, we return success with a URL to our internal form
        $paymentUrl = route('payment.mfs-manual.show', [
            'transaction_id' => $data['transaction_id'],
        ]);

        return [
            'success' => true,
            'payment_url' => $paymentUrl,
            'payment_id' => $data['transaction_id'],
            'transaction_status' => 'Initiated',
            'response' => [
                'message' => 'Redirecting to MFS Manual payment form',
            ],
        ];
    }

    public function handleCallback(array $data): array
    {
        // MFS Manual doesn't have callbacks since it's internal
        // This should not be called, but we'll return a safe response
        return [
            'success' => false,
            'message' => 'MFS Manual gateway does not support callbacks',
        ];
    }
}
