<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGatewayInterface;
use App\Library\SslCommerz\SslCommerzNotification;
use Illuminate\Support\Facades\Log;

class SslCommerzGateway implements PaymentGatewayInterface
{
    protected SslCommerzNotification $sslCommerz;

    public function __construct()
    {
        $this->sslCommerz = new SslCommerzNotification;
    }

    public function getGatewayName(): string
    {
        return 'sslcommerz';
    }

    public function initiatePayment(array $data): array
    {

        try {
            $paymentData = [
                'total_amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'BDT',
                'tran_id' => $data['transaction_id'],
                'product_category' => $data['product_category'] ?? 'general',
                'product_name' => $data['product_name'] ?? 'Payment',
                'product_profile' => $data['product_profile'] ?? 'general',

                // Customer info
                'cus_name' => $data['customer_name'] ?? 'Customer',
                'cus_email' => $data['customer_email'] ?? $data['payer_reference'],
                'cus_add1' => $data['customer_address'] ?? 'N/A',
                'cus_city' => $data['customer_city'] ?? 'Dhaka',
                'cus_country' => $data['customer_country'] ?? 'Bangladesh',
                'cus_phone' => $data['customer_phone'] ?? null,

                // Shipping info
                'shipping_method' => 'NO',
                'num_of_item' => 1,

            ];

            $response = $this->sslCommerz->makePayment($paymentData, 'checkout', 'json');

            $decodedResponse = json_decode($response, true);
            if (isset($decodedResponse['status']) && in_array(strtoupper($decodedResponse['status']), ['SUCCESS', 'SUCCESSFUL'])) {
                return [
                    'success' => true,
                    'payment_url' => $decodedResponse['data'],
                    'payment_id' => $data['transaction_id'],
                    'transaction_status' => 'Initiated',
                    'response' => $decodedResponse,
                ];
            }

            return [
                'success' => false,
                'message' => $decodedResponse['message'] ?? 'Payment initiation failed',
                'response' => $decodedResponse,
            ];
        } catch (\Exception $e) {
            Log::error('SSL Commerz payment initiation error: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Payment gateway error: '.$e->getMessage(),
            ];
        }
    }

    public function handleCallback(array $data): array
    {
        try {
            if (! isset($data['tran_id']) || ! isset($data['status'])) {
                return [
                    'success' => false,
                    'message' => 'Invalid callback data',
                ];
            }

            $tranId = $data['tran_id'];
            $status = strtoupper($data['status']);
            $amount = $data['amount'] ?? 0;
            $currency = $data['currency'] ?? 'BDT';

            // Handle failed payments
            if ($status === 'FAILED') {
                $errorMessage = $data['error'] ?? 'Payment failed';

                return [
                    'success' => false,
                    'status' => 'Failed',
                    'transaction_id' => $tranId,
                    'gateway_transaction_id' => $tranId,
                    'bank_transaction_id' => $data['bank_tran_id'] ?? null,
                    'amount' => $amount,
                    'currency' => $currency,
                    'message' => $errorMessage,
                    'response' => $data,
                ];
            }

            // Handle cancelled payments
            if ($status === 'CANCELLED') {
                $errorMessage = $data['error'] ?? 'Payment was cancelled';

                return [
                    'success' => false,
                    'status' => 'Cancelled',
                    'transaction_id' => $tranId,
                    'gateway_transaction_id' => $tranId,
                    'bank_transaction_id' => $data['bank_tran_id'] ?? null,
                    'amount' => $amount,
                    'currency' => $currency,
                    'message' => $errorMessage,
                    'response' => $data,
                ];
            }

            // Validate the transaction with SSL Commerz for successful payments
            $validated = $this->sslCommerz->orderValidate($data, $tranId, $amount, $currency);

            if ($validated === true) {
                return [
                    'success' => true,
                    'status' => 'Completed',
                    'transaction_id' => $tranId,
                    'gateway_transaction_id' => $tranId,
                    'bank_transaction_id' => $data['bank_tran_id'] ?? null,
                    'amount' => $amount,
                    'currency' => $currency,
                    'response' => $data,
                ];
            }

            return [
                'success' => false,
                'status' => $status,
                'payment_id' => $tranId,
                'message' => 'Payment validation failed',
                'response' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('SSL Commerz callback handling error: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Callback processing error: '.$e->getMessage(),
            ];
        }
    }
}
