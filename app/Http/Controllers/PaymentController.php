<?php

namespace App\Http\Controllers;

use App\Contracts\Payable;
use App\Models\InternalContestRegistration;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Initiate payment for registration
     */
    public function initiateRegistrationPayment(Request $request, InternalContestRegistration $registration)
    {
        $validated = $request->validate([
            'gateway' => 'required|string|in:sslcommerz',
        ]);

        $registrationAmount = $registration->internalContest->registration_fee;

        try {
            $additionalData = [
                'callback_url' => route('payment.callback', ['gateway' => $validated['gateway']]),
                'payer_reference' => $registration->email,
            ];

            // Add SSL Commerz specific fields if needed
            if ($validated['gateway'] === 'sslcommerz') {
                $additionalData = array_merge($additionalData, [
                    'customer_name' => $registration->name,
                    'customer_email' => $registration->email,
                    'customer_phone' => $registration->phone,
                    'product_name' => 'Contest Registration',
                    'product_category' => 'registration',
                ]);
            }

            $result = $this->paymentService->initiatePayment(
                model: $registration,
                gateway: $validated['gateway'],
                amount: (float) $registrationAmount,
                additionalData: $additionalData
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'payment_url' => $result['payment_url'],
                    'payment_id' => $result['payment_id'],
                    'message' => 'Payment initiated successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Payment initiation failed',
            ], 422);
        } catch (\Exception $e) {
            Log::error('Payment initiation error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while initiating payment',
            ], 500);
        }
    }

    /**
     * Handle payment gateway callback
     */
    public function handleCallback(Request $request, string $gateway)
    {
        try {
            // Get callback data from request
            $callbackData = $request->all();

            Log::info('Payment callback received', [
                'gateway' => $gateway,
                'data' => $callbackData,
            ]);

            // Handle the callback through payment service
            $result = $this->paymentService->handleCallback($gateway, $callbackData);

            if (! isset($result['payment_id'])) {
                Log::error('Payment callback missing payment_id', ['result' => $result]);

                return $this->handleFailedCallback('Invalid callback response');
            }

            // Find the payment by transaction ID
            $payment = Payment::where('transaction_id', $result['payment_id'])->first();

            if (! $payment) {
                Log::error('Payment not found for callback', ['payment_id' => $result['payment_id']]);

                return $this->handleFailedCallback('Payment not found');
            }

            // Process the payment result using database transaction
            DB::beginTransaction();
            try {
                if ($result['success']) {
                    // Mark payment as successful and call model hook
                    $payment->payable->markPaymentAsSuccessful($payment, [
                        'gateway_transaction_id' => $result['transaction_id'] ?? $result['payment_id'],
                        'callback_response' => $result['response'] ?? $callbackData,
                    ]);

                    // Call the model-specific success handler
                    $payment->payable->onPaymentSuccessful($payment);

                    DB::commit();

                    Log::info('Payment successful', ['payment_id' => $payment->id]);

                    return $this->handleSuccessfulCallback($payment);
                } else {
                    // Mark payment as failed and call model hook
                    $payment->payable->markPaymentAsFailed($payment, [
                        'callback_response' => $result['response'] ?? $callbackData,
                    ]);

                    // Call the model-specific failure handler
                    $payment->payable->onPaymentFailed($payment);

                    DB::commit();

                    Log::warning('Payment failed', ['payment_id' => $payment->id, 'result' => $result]);

                    return $this->handleFailedCallback($result['message'] ?? 'Payment failed');
                }
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
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
        $payable = $payment->payable;

        // Determine redirect URL based on payable type
        $redirectUrl = match (true) {
            $payable instanceof InternalContestRegistration => route('internal-contests.my-registration', [
                'internalContest' => $payable->internalContest->slug,
            ]),
            default => route('home'),
        };

        return Inertia::location($redirectUrl.'?payment=success');
    }

    /**
     * Handle failed payment callback
     */
    protected function handleFailedCallback(string $message)
    {
        return Inertia::location(route('home').'?payment=failed&message='.urlencode($message));
    }
}
