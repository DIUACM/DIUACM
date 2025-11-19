<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class SslCommerzGateway implements PaymentGatewayInterface
{
    protected SslCommerzNotification $sslCommerz;

    protected array $config;

    public function __construct()
    {
        $this->sslCommerz = new SslCommerzNotification;
        $this->config = config('sslcommerz');
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
                'tran_id' => $data['invoice_number'],
                'product_category' => $data['product_category'] ?? 'general',
                'product_name' => $data['product_name'] ?? 'Payment',
                'product_profile' => $data['product_profile'] ?? 'general',

                // Customer info
                'cus_name' => $data['customer_name'] ?? 'Customer',
                'cus_email' => $data['customer_email'] ?? $data['payer_reference'],
                'cus_add1' => $data['customer_address'] ?? 'N/A',
                'cus_city' => $data['customer_city'] ?? 'Dhaka',
                'cus_country' => $data['customer_country'] ?? 'Bangladesh',
                'cus_phone' => $data['customer_phone'] ?? '01700000000',

                // Shipping info
                'shipping_method' => 'NO',
                'num_of_item' => 1,

                // Additional data
                'value_a' => $data['value_a'] ?? null,
                'value_b' => $data['value_b'] ?? null,
                'value_c' => $data['value_c'] ?? null,
                'value_d' => $data['value_d'] ?? null,
            ];

            $response = $this->sslCommerz->makePayment($paymentData, 'checkout', 'json');

            $decodedResponse = json_decode($response, true);

            

            if (isset($decodedResponse['status']) && in_array(strtoupper($decodedResponse['status']), ['SUCCESS', 'SUCCESSFUL'])) {
                return [
                    'success' => true,
                    'payment_url' => $decodedResponse['data'],
                    'payment_id' => $data['invoice_number'],
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

    public function verifyPayment(string $transactionId): array
    {
        try {
            // In SSL Commerz, verification is done through the callback data
            // This method can be used to query transaction status
            $validationUrl = $this->config['apiDomain'].$this->config['apiUrl']['transaction_status'];

            $storeId = $this->config['apiCredentials']['store_id'];
            $storePassword = $this->config['apiCredentials']['store_password'];

            $requestedUrl = $validationUrl.'?tran_id='.urlencode($transactionId).
                '&store_id='.urlencode($storeId).
                '&store_passwd='.urlencode($storePassword).'&format=json';

            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, $requestedUrl);
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

            if ($this->config['connect_from_localhost']) {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 0);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 0);
            } else {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 2);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 2);
            }

            $result = curl_exec($handle);
            $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
            curl_close($handle);

            if ($code == 200) {
                $resultData = json_decode($result, true);

                if (isset($resultData['status'])) {
                    $status = strtoupper($resultData['status']);

                    if (in_array($status, ['VALID', 'VALIDATED'])) {
                        return [
                            'success' => true,
                            'status' => 'Completed',
                            'transaction_id' => $resultData['tran_id'] ?? $transactionId,
                            'bank_transaction_id' => $resultData['bank_tran_id'] ?? null,
                            'response' => $resultData,
                        ];
                    }

                    return [
                        'success' => false,
                        'status' => $status,
                        'message' => 'Payment verification failed with status: '.$status,
                        'response' => $resultData,
                    ];
                }
            }

            return [
                'success' => false,
                'message' => 'Failed to verify payment',
            ];
        } catch (\Exception $e) {
            Log::error('SSL Commerz payment verification error: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Verification error: '.$e->getMessage(),
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

            // Validate the transaction with SSL Commerz
            $validated = $this->sslCommerz->orderValidate($data, $tranId, $amount, $currency);

            if ($validated === true) {
                return [
                    'success' => true,
                    'status' => 'Completed',
                    'payment_id' => $tranId,
                    'transaction_id' => $data['bank_tran_id'] ?? null,
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

    public function refundPayment(Payment $payment, ?float $amount = null): array
    {
        try {
            $refundAmount = $amount ?? $payment->amount;

            $refundUrl = $this->config['apiDomain'].$this->config['apiUrl']['refund_payment'];

            $storeId = $this->config['apiCredentials']['store_id'];
            $storePassword = $this->config['apiCredentials']['store_password'];

            $bankTranId = $payment->gateway_response['bank_tran_id'] ?? null;

            if (! $bankTranId) {
                return [
                    'success' => false,
                    'message' => 'Bank transaction ID not found. Cannot process refund.',
                ];
            }

            $refundData = [
                'refund_amount' => $refundAmount,
                'refund_remarks' => 'Refund request',
                'bank_tran_id' => $bankTranId,
                'refe_id' => $payment->transaction_id.'_refund_'.time(),
            ];

            $requestedUrl = $refundUrl.'?bank_tran_id='.urlencode($bankTranId).
                '&store_id='.urlencode($storeId).
                '&store_passwd='.urlencode($storePassword).
                '&refund_amount='.urlencode($refundAmount).
                '&refund_remarks='.urlencode($refundData['refund_remarks']).
                '&refe_id='.urlencode($refundData['refe_id']).
                '&format=json';

            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, $requestedUrl);
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

            if ($this->config['connect_from_localhost']) {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 0);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 0);
            } else {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 2);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 2);
            }

            $result = curl_exec($handle);
            $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
            curl_close($handle);

            if ($code == 200) {
                $resultData = json_decode($result, true);

                if (isset($resultData['status']) && strtoupper($resultData['status']) === 'SUCCESS') {
                    return [
                        'success' => true,
                        'status' => 'Refunded',
                        'refund_ref_id' => $resultData['refund_ref_id'] ?? $refundData['refe_id'],
                        'response' => $resultData,
                    ];
                }

                return [
                    'success' => false,
                    'message' => $resultData['errorReason'] ?? 'Refund failed',
                    'response' => $resultData,
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to connect with SSL Commerz for refund',
            ];
        } catch (\Exception $e) {
            Log::error('SSL Commerz refund error: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Refund error: '.$e->getMessage(),
            ];
        }
    }

    public function getPaymentStatus(string $transactionId): string
    {
        try {
            $validationUrl = $this->config['apiDomain'].$this->config['apiUrl']['transaction_status'];

            $storeId = $this->config['apiCredentials']['store_id'];
            $storePassword = $this->config['apiCredentials']['store_password'];

            $requestedUrl = $validationUrl.'?tran_id='.urlencode($transactionId).
                '&store_id='.urlencode($storeId).
                '&store_passwd='.urlencode($storePassword).'&format=json';

            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, $requestedUrl);
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

            if ($this->config['connect_from_localhost']) {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 0);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 0);
            } else {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 2);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 2);
            }

            $result = curl_exec($handle);
            $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
            curl_close($handle);

            if ($code == 200) {
                $resultData = json_decode($result, true);

                if (isset($resultData['status'])) {
                    $status = strtoupper($resultData['status']);

                    return match ($status) {
                        'VALID', 'VALIDATED' => PaymentStatus::PAID->value,
                        'FAILED' => PaymentStatus::FAILED->value,
                        'CANCELLED' => PaymentStatus::CANCELED->value,
                        default => PaymentStatus::PENDING->value,
                    };
                }
            }

            return PaymentStatus::PENDING->value;
        } catch (\Exception $e) {
            Log::error('SSL Commerz status check error: '.$e->getMessage());

            return PaymentStatus::PENDING->value;
        }
    }
}
