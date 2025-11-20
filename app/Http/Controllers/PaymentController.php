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

        try {
            // Use database transaction with locking to prevent race conditions
            return DB::transaction(function () use ($registration, $validated) {
                // Lock the registration row to prevent concurrent payment initiations
                $registration = InternalContestRegistration::where('id', $registration->id)
                    ->lockForUpdate()
                    ->first();

                if (! $registration) {
                    return redirect()->back()->with('error', 'Registration not found');
                }

                // Authorization check: Ensure user owns this registration
                if (auth()->check() && $registration->user_id !== auth()->id()) {
                    abort(403, 'Unauthorized access to this registration');
                }

                // Check if registration is free (no payment required)
                if ($registration->isFree()) {
                    return redirect()->back()->with('error', 'This registration does not require payment');
                }

                // Check if registration already has a successful payment
                if ($registration->hasSuccessfulPayment()) {
                    return redirect()->back()->with('error', 'Payment has already been completed for this registration');
                }

                // Check for pending or under review payments
                $latestPayment = $registration->latestPayment();
                if ($latestPayment) {
                  
                    if ($latestPayment->status->value === 'under_manual_review') {
                        return redirect()->back()->with(
                            'info',
                            'Your payment is currently under manual review by our team. Please wait for verification. You will be notified once the review is complete.'
                        );
                    }
                }

                $registrationAmount = $registration->internalContest->registration_fee;

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
                    return Inertia::location($result['payment_url']);
                }

                return redirect()->back()->with('error', $result['message'] ?? 'Payment initiation failed');
            });
        } catch (\Exception $e) {
            Log::error('Payment initiation error: '.$e->getMessage(), [
                'registration_id' => $registration->id,
                'user_id' => auth()->id(),
                'exception' => $e,
            ]);

            return redirect()->back()->with('error', 'An error occurred while initiating payment. Please try again.');
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

            if (! isset($result['transaction_id'])) {
                Log::error('Payment callback missing transaction_id', ['result' => $result]);

                return $this->handleFailedCallback('Invalid callback response');
            }

            // Use database transaction with row locking to prevent race conditions
            return DB::transaction(function () use ($result, $callbackData) {
                // Find and lock the payment by transaction ID
                $payment = Payment::where('transaction_id', $result['transaction_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $payment) {
                    Log::error('Payment not found for callback', ['transaction_id' => $result['transaction_id']]);

                    return $this->handleFailedCallback('Payment not found');
                }

                // Verify gateway transaction ID match
                if (! isset($result['gateway_transaction_id']) || $payment->gateway_transaction_id !== $result['gateway_transaction_id']) {
                    Log::error('Gateway transaction ID mismatch', [
                        'expected' => $payment->gateway_transaction_id,
                        'received' => $result['gateway_transaction_id'] ?? null,
                    ]);

                    return $this->handleFailedCallback('Gateway transaction ID mismatch');
                }

                // Prevent processing already completed payments (idempotency)
                if (in_array($payment->status->value, ['paid', 'refunded'])) {
                    Log::info('Payment already processed, returning success', ['payment_id' => $payment->id]);

                    return $this->handleSuccessfulCallback($payment);
                }

                // Prevent processing payments under manual review
                if ($payment->status->value === 'under_manual_review') {
                    Log::info('Payment under manual review, ignoring callback', ['payment_id' => $payment->id]);

                    return $this->handleManualReviewCallback($payment);
                }

                if ($result['success']) {
                    // Mark payment as successful and call model hook
                    $payment->payable->markPaymentAsSuccessful($payment, [
                        'callback_response' => $result['response'] ?? $callbackData,
                    ]);

                    // Call the model-specific success handler
                    $payment->payable->onPaymentSuccessful($payment);

                    Log::info('Payment successful', ['payment_id' => $payment->id]);

                    return $this->handleSuccessfulCallback($payment);
                } else {
                    // Mark payment as failed and call model hook
                    $payment->payable->markPaymentAsFailed($payment, [
                        'callback_response' => $result['response'] ?? $callbackData,
                    ]);

                    // Call the model-specific failure handler
                    $payment->payable->onPaymentFailed($payment);

                    Log::warning('Payment failed', ['payment_id' => $payment->id, 'result' => $result]);

                    return $this->handleFailedCallback($result['message'] ?? 'Payment failed');
                }
            });
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

    /**
     * Handle manual review payment callback
     */
    protected function handleManualReviewCallback(Payment $payment)
    {
        $payable = $payment->payable;

        // Determine redirect URL based on payable type
        $redirectUrl = match (true) {
            $payable instanceof InternalContestRegistration => route('internal-contests.my-registration', [
                'internalContest' => $payable->internalContest->slug,
            ]),
            default => route('home'),
        };

        return Inertia::location($redirectUrl.'?payment=under_review');
    }
}
