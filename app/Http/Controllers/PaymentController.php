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
     * Show payment gateway selection page
     */
    public function showGatewaySelection(InternalContestRegistration $registration)
    {
        // Authorization check: Ensure user owns this registration
        if (auth()->check() && $registration->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this registration');
        }

        // Check if can initiate new payment
        $paymentCheck = $registration->canInitiateNewPayment();

        if (! $paymentCheck['can_pay']) {
            return redirect()->route('internal-contests.my-registration', $registration->internalContest)
                ->with('error', $paymentCheck['message']);
        }

        return Inertia::render('payments/select-gateway', [
            'registration' => [
                'id' => $registration->id,
                'name' => $registration->name,
                'email' => $registration->email,
                'amount' => $registration->internalContest->registration_fee,
                'contest_title' => $registration->internalContest->title,
            ],
        ]);
    }

    /**
     * Initiate payment for registration
     */
    public function initiateRegistrationPayment(Request $request, InternalContestRegistration $registration)
    {
        $validated = $request->validate([
            'gateway' => 'required|string|in:sslcommerz',
        ]);

        // Authorization check BEFORE transaction: Ensure user owns this registration
        if (auth()->check() && $registration->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this registration');
        }

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

                // Check if can initiate new payment
                $paymentCheck = $registration->canInitiateNewPayment();

                if (! $paymentCheck['can_pay']) {
                    $flashType = $paymentCheck['reason'] === 'under_review' ? 'info' : 'error';

                    return redirect()->back()->with($flashType, $paymentCheck['message']);
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

                    return $this->handleFailedCallback('Payment not found', null);
                }

                // Verify gateway transaction ID match
                if (! isset($result['gateway_transaction_id']) || $payment->gateway_transaction_id !== $result['gateway_transaction_id']) {
                    Log::error('Gateway transaction ID mismatch', [
                        'expected' => $payment->gateway_transaction_id,
                        'received' => $result['gateway_transaction_id'] ?? null,
                    ]);

                    return $this->handleFailedCallback('Gateway transaction ID mismatch', $payment);
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
                    // Check if payment was cancelled vs failed
                    $status = $result['status'] ?? 'Failed';

                    if (strtolower($status) === 'cancelled') {
                        // Mark payment as cancelled and call model hook
                        $payment->payable->markPaymentAsCancelled($payment, [
                            'callback_response' => $result['response'] ?? $callbackData,
                        ]);

                        // Call the model-specific cancellation handler
                        $payment->payable->onPaymentCancelled($payment);

                        Log::info('Payment cancelled', ['payment_id' => $payment->id, 'result' => $result]);

                        return $this->handleCancelledCallback($result['message'] ?? 'Payment was cancelled', $payment);
                    } else {
                        // Mark payment as failed and call model hook
                        $payment->payable->markPaymentAsFailed($payment, [
                            'callback_response' => $result['response'] ?? $callbackData,
                        ]);

                        // Call the model-specific failure handler
                        $payment->payable->onPaymentFailed($payment);

                        Log::warning('Payment failed', ['payment_id' => $payment->id, 'result' => $result]);

                        return $this->handleFailedCallback($result['message'] ?? 'Payment failed', $payment);
                    }
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

        return redirect($redirectUrl)->with('success', 'Payment completed successfully!');
    }

    /**
     * Handle failed payment callback
     */
    protected function handleFailedCallback(string $message, ?Payment $payment = null)
    {
        $redirectUrl = route('home');

        if ($payment) {
            $payable = $payment->payable;
            $redirectUrl = match (true) {
                $payable instanceof InternalContestRegistration => route('internal-contests.my-registration', [
                    'internalContest' => $payable->internalContest->slug,
                ]),
                default => route('home'),
            };
        }

        return redirect($redirectUrl)->with('error', $message);
    }

    /**
     * Handle cancelled payment callback
     */
    protected function handleCancelledCallback(string $message, ?Payment $payment = null)
    {
        $redirectUrl = route('home');

        if ($payment) {
            $payable = $payment->payable;
            $redirectUrl = match (true) {
                $payable instanceof InternalContestRegistration => route('internal-contests.my-registration', [
                    'internalContest' => $payable->internalContest->slug,
                ]),
                default => route('home'),
            };
        }

        return redirect($redirectUrl)->with('info', $message);
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

        return redirect($redirectUrl)->with('info', 'Your payment is currently under manual review by our team. Please wait for verification.');
    }

    /**
     * Handle IPN (Instant Payment Notification) from payment gateway
     * This is a server-to-server callback, not user-facing
     */
    public function handleIPN(Request $request, string $gateway)
    {
        try {
            // Get IPN data from request
            $ipnData = $request->all();

            Log::info('Payment IPN received', [
                'gateway' => $gateway,
                'data' => $ipnData,
            ]);

            // Handle the IPN through payment service
            $result = $this->paymentService->handleCallback($gateway, $ipnData);

            if (! isset($result['transaction_id'])) {
                Log::error('Payment IPN missing transaction_id', ['result' => $result]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid IPN response',
                ], 400);
            }

            // Use database transaction with row locking to prevent race conditions
            DB::transaction(function () use ($result, $ipnData) {
                // Find and lock the payment by transaction ID
                $payment = Payment::where('transaction_id', $result['transaction_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $payment) {
                    Log::error('Payment not found for IPN', ['transaction_id' => $result['transaction_id']]);

                    return;
                }

                // Verify gateway transaction ID match
                if (! isset($result['gateway_transaction_id']) || $payment->gateway_transaction_id !== $result['gateway_transaction_id']) {
                    Log::error('Gateway transaction ID mismatch in IPN', [
                        'expected' => $payment->gateway_transaction_id,
                        'received' => $result['gateway_transaction_id'] ?? null,
                    ]);

                    return;
                }

                // Prevent processing already completed payments (idempotency)
                if (in_array($payment->status->value, ['paid', 'refunded'])) {
                    Log::info('Payment already processed in IPN, skipping', ['payment_id' => $payment->id]);

                    return;
                }

                // Prevent processing payments under manual review
                if ($payment->status->value === 'under_manual_review') {
                    Log::info('Payment under manual review in IPN, skipping', ['payment_id' => $payment->id]);

                    return;
                }

                if ($result['success']) {
                    // Mark payment as successful and call model hook
                    $payment->payable->markPaymentAsSuccessful($payment, [
                        'ipn_response' => $result['response'] ?? $ipnData,
                    ]);

                    // Call the model-specific success handler
                    $payment->payable->onPaymentSuccessful($payment);

                    Log::info('Payment successful via IPN', ['payment_id' => $payment->id]);
                } else {
                    // Check if payment was cancelled vs failed
                    $status = $result['status'] ?? 'Failed';

                    if (strtolower($status) === 'cancelled') {
                        // Mark payment as cancelled and call model hook
                        $payment->payable->markPaymentAsCancelled($payment, [
                            'ipn_response' => $result['response'] ?? $ipnData,
                        ]);

                        // Call the model-specific cancellation handler
                        $payment->payable->onPaymentCancelled($payment);

                        Log::info('Payment cancelled via IPN', ['payment_id' => $payment->id]);
                    } else {
                        // Mark payment as failed and call model hook
                        $payment->payable->markPaymentAsFailed($payment, [
                            'ipn_response' => $result['response'] ?? $ipnData,
                        ]);

                        // Call the model-specific failure handler
                        $payment->payable->onPaymentFailed($payment);

                        Log::warning('Payment failed via IPN', ['payment_id' => $payment->id]);
                    }
                }
            });

            // Return success response to payment gateway
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
