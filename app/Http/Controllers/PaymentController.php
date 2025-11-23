<?php

namespace App\Http\Controllers;

use App\Contracts\Payable;
use App\Models\InternalContestRegistration;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected InternalContestRegistrationPaymentController $registrationPaymentController
    ) {}

    /**
     * Handle payment gateway callback
     */
    public function handleCallback(Request $request, string $gateway)
    {
        try {
            $callbackData = $request->all();

            Log::info('Payment callback received', [
                'gateway' => $gateway,
                'data' => $callbackData,
            ]);

            $result = $this->paymentService->handleCallback($gateway, $callbackData);

            return $this->processPaymentCallback($result, $callbackData);
        } catch (\Exception $e) {
            Log::error('Payment callback error: '.$e->getMessage(), [
                'gateway' => $gateway,
                'exception' => $e,
            ]);

            return $this->handleFailedCallback('An error occurred while processing payment');
        }
    }

    /**
     * Handle successful payment callback
     */
    protected function handleSuccessfulCallback(Payment $payment)
    {
        return redirect($this->getRedirectUrl($payment))
            ->with('success', 'Payment completed successfully!');
    }

    /**
     * Handle failed payment callback
     */
    protected function handleFailedCallback(string $message, ?Payment $payment = null)
    {
        return redirect($this->getRedirectUrl($payment))
            ->with('error', $message);
    }

    /**
     * Handle cancelled payment callback
     */
    protected function handleCancelledCallback(string $message, ?Payment $payment = null)
    {
        return redirect($this->getRedirectUrl($payment))
            ->with('info', $message);
    }

    /**
     * Handle manual review payment callback
     */
    protected function handleManualReviewCallback(Payment $payment)
    {
        return redirect($this->getRedirectUrl($payment))
            ->with('info', 'Your payment is currently under manual review by our team. Please wait for verification.');
    }

    /**
     * Get redirect URL based on payable type
     */
    protected function getRedirectUrl(?Payment $payment = null): string
    {
        if (! $payment || ! $payment->payable) {
            return route('home');
        }

        $payable = $payment->payable;

        return match (true) {
            $payable instanceof InternalContestRegistration => $this->registrationPaymentController->getRedirectUrl($payable),
            default => route('home'),
        };
    }

    /**
     * Process payment callback with validation and locking
     */
    protected function processPaymentCallback(array $result, array $callbackData)
    {
        if (! isset($result['transaction_id'])) {
            Log::error('Payment callback missing transaction_id', ['result' => $result]);

            return $this->handleFailedCallback('Invalid callback response');
        }

        return DB::transaction(function () use ($result, $callbackData) {
            $payment = Payment::where('transaction_id', $result['transaction_id'])
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                Log::error('Payment not found for callback', ['transaction_id' => $result['transaction_id']]);

                return $this->handleFailedCallback('Payment not found', null);
            }

            if (! $this->validateGatewayTransactionId($payment, $result)) {
                return $this->handleFailedCallback('Gateway transaction ID mismatch', $payment);
            }

            if ($this->isPaymentAlreadyProcessed($payment)) {
                return $this->handleSuccessfulCallback($payment);
            }

            if ($this->isPaymentUnderReview($payment)) {
                return $this->handleManualReviewCallback($payment);
            }

            return $this->executePaymentAction($payment, $result, $callbackData);
        });
    }

    /**
     * Validate gateway transaction ID matches
     */
    protected function validateGatewayTransactionId(Payment $payment, array $result): bool
    {
        if (! isset($result['gateway_transaction_id']) || $payment->gateway_transaction_id !== $result['gateway_transaction_id']) {
            Log::error('Gateway transaction ID mismatch', [
                'expected' => $payment->gateway_transaction_id,
                'received' => $result['gateway_transaction_id'] ?? null,
            ]);

            return false;
        }

        return true;
    }

    /**
     * Check if payment is already processed
     */
    protected function isPaymentAlreadyProcessed(Payment $payment): bool
    {
        if (in_array($payment->status->value, ['paid', 'refunded'])) {
            Log::info('Payment already processed, returning success', ['payment_id' => $payment->id]);

            return true;
        }

        return false;
    }

    /**
     * Check if payment is under manual review
     */
    protected function isPaymentUnderReview(Payment $payment): bool
    {
        if ($payment->status->value === 'under_manual_review') {
            Log::info('Payment under manual review, ignoring callback', ['payment_id' => $payment->id]);

            return true;
        }

        return false;
    }

    /**
     * Execute payment action based on result
     */
    protected function executePaymentAction(Payment $payment, array $result, array $callbackData)
    {
        if ($result['success']) {
            $payment->payable->markPaymentAsSuccessful($payment, [
                'callback_response' => $result['response'] ?? $callbackData,
            ]);
            $payment->payable->onPaymentSuccessful($payment);
            Log::info('Payment successful', ['payment_id' => $payment->id]);

            return $this->handleSuccessfulCallback($payment);
        }

        $status = $result['status'] ?? 'Failed';

        if (strtolower($status) === 'cancelled') {
            $payment->payable->markPaymentAsCancelled($payment, [
                'callback_response' => $result['response'] ?? $callbackData,
            ]);
            $payment->payable->onPaymentCancelled($payment);
            Log::info('Payment cancelled', ['payment_id' => $payment->id]);

            return $this->handleCancelledCallback($result['message'] ?? 'Payment was cancelled', $payment);
        }

        $payment->payable->markPaymentAsFailed($payment, [
            'callback_response' => $result['response'] ?? $callbackData,
        ]);
        $payment->payable->onPaymentFailed($payment);
        Log::info('Payment failed', ['payment_id' => $payment->id]);

        return $this->handleFailedCallback($result['message'] ?? 'Payment failed', $payment);
    }

    /**
     * Handle IPN (Instant Payment Notification) from payment gateway
     * This is a server-to-server callback, not user-facing
     */
    public function handleIPN(Request $request, string $gateway)
    {
        try {
            $ipnData = $request->all();

            Log::info('Payment IPN received', [
                'gateway' => $gateway,
                'data' => $ipnData,
            ]);

            $result = $this->paymentService->handleCallback($gateway, $ipnData);

            if (! isset($result['transaction_id'])) {
                Log::error('Payment IPN missing transaction_id', ['result' => $result]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid IPN response',
                ], 400);
            }

            DB::transaction(function () use ($result, $ipnData) {
                $payment = Payment::where('transaction_id', $result['transaction_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $payment) {
                    Log::error('Payment not found for IPN', ['transaction_id' => $result['transaction_id']]);

                    return;
                }

                if (! $this->validateGatewayTransactionId($payment, $result)) {
                    return;
                }

                if ($this->isPaymentAlreadyProcessed($payment) || $this->isPaymentUnderReview($payment)) {
                    return;
                }

                if ($result['success']) {
                    $payment->payable->markPaymentAsSuccessful($payment, [
                        'ipn_response' => $result['response'] ?? $ipnData,
                    ]);
                    $payment->payable->onPaymentSuccessful($payment);
                    Log::info('Payment successful via IPN', ['payment_id' => $payment->id]);
                } else {
                    $status = $result['status'] ?? 'Failed';

                    if (strtolower($status) === 'cancelled') {
                        $payment->payable->markPaymentAsCancelled($payment, [
                            'ipn_response' => $result['response'] ?? $ipnData,
                        ]);
                        $payment->payable->onPaymentCancelled($payment);
                        Log::info('Payment cancelled via IPN', ['payment_id' => $payment->id]);
                    } else {
                        $payment->payable->markPaymentAsFailed($payment, [
                            'ipn_response' => $result['response'] ?? $ipnData,
                        ]);
                        $payment->payable->onPaymentFailed($payment);
                        Log::info('Payment failed via IPN', ['payment_id' => $payment->id]);
                    }
                }
            });

            return response()->json([
                'status' => 'success',
                'message' => 'IPN processed successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Payment IPN error: '.$e->getMessage(), [
                'gateway' => $gateway,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while processing IPN',
            ], 500);
        }
    }
}
