<?php

namespace App\Http\Controllers;

use App\Contracts\Payable;
use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use App\Enums\PaymentStatus;
use App\Models\InternalContestRegistration;
use App\Models\MfsManualTransaction;
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
        $this->authorizeRegistrationOwnership($registration);

        $paymentCheck = $registration->canInitiateNewPayment();

        if (! $paymentCheck['can_pay']) {
            return redirect()
                ->route('internal-contests.my-registration', $registration->internalContest)
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
            'gateway' => 'required|string|in:sslcommerz,mfs_manual',
        ]);

        $this->authorizeRegistrationOwnership($registration);

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
     * Authorize that the user owns the registration
     */
    protected function authorizeRegistrationOwnership(InternalContestRegistration $registration): void
    {
        if (auth()->check() && $registration->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this registration');
        }
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
            $payable instanceof InternalContestRegistration => route('internal-contests.my-registration', [
                'internalContest' => $payable->internalContest->slug,
            ]),
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

    /**
     * Show MFS Manual payment form
     */
    public function showMfsManualForm(Request $request)
    {
        $transactionId = $request->get('transaction_id');

        if (! $transactionId) {
            return redirect()->route('home')->with('error', 'Invalid payment transaction');
        }

        // Find the payment by transaction ID
        $payment = Payment::where('transaction_id', $transactionId)
            ->where('gateway', 'mfs_manual')
            ->where('status', PaymentStatus::PENDING)
            ->first();

        if (! $payment) {
            return redirect()->route('home')->with('error', 'Payment not found or already processed');
        }

        // Get payable model (registration)
        $payable = $payment->payable;

        if (! $payable) {
            return redirect()->route('home')->with('error', 'Associated registration not found');
        }

        // Authorize ownership
        if ($payable instanceof InternalContestRegistration) {
            $this->authorizeRegistrationOwnership($payable);
        }

        // MFS receiver numbers - you can make this configurable via env or config
        $receiverNumbers = [
            'bkash' => config('services.mfs.bkash_number', '01XXXXXXXXX'),
            'nagad' => config('services.mfs.nagad_number', '01XXXXXXXXX'),
            'rocket' => config('services.mfs.rocket_number', '01XXXXXXXXX'),
        ];

        return Inertia::render('payments/mfs-manual', [
            'payment' => [
                'id' => $payment->id,
                'transaction_id' => $payment->transaction_id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
            ],
            'payable' => [
                'type' => $payable->getMorphClass(),
                'name' => $payable->name ?? 'N/A',
                'email' => $payable->email ?? 'N/A',
                'contest_title' => $payable instanceof InternalContestRegistration ? $payable->internalContest->title : 'N/A',
            ],
            'receiver_numbers' => $receiverNumbers,
            'mfs_types' => collect(MfsType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->getLabel(),
            ]),
        ]);
    }

    /**
     * Submit MFS Manual payment
     */
    public function submitMfsManual(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|string',
            'mfs_type' => 'required|string|in:bkash,nagad,rocket',
            'sender_number' => 'required|string|regex:/^01[0-9]{9}$/',
            'mfs_transaction_id' => 'required|string|min:5|max:50',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                // Lock the payment record
                $payment = Payment::where('transaction_id', $validated['transaction_id'])
                    ->where('gateway', 'mfs_manual')
                    ->lockForUpdate()
                    ->first();

                if (! $payment) {
                    return redirect()->route('home')->with('error', 'Payment not found');
                }

                // Check if payment is still pending
                if ($payment->status !== PaymentStatus::PENDING) {
                    return redirect($this->getRedirectUrl($payment))
                        ->with('info', 'This payment has already been processed');
                }

                // Get receiver number based on MFS type
                $receiverNumbers = [
                    'bkash' => config('services.mfs.bkash_number', '01XXXXXXXXX'),
                    'nagad' => config('services.mfs.nagad_number', '01XXXXXXXXX'),
                    'rocket' => config('services.mfs.rocket_number', '01XXXXXXXXX'),
                ];

                $receiverNumber = $receiverNumbers[$validated['mfs_type']] ?? null;

                // Create MFS Manual Transaction record
                MfsManualTransaction::create([
                    'payment_id' => $payment->id,
                    'status' => MfsTransactionStatus::PENDING,
                    'sender_number' => $validated['sender_number'],
                    'receiver_number' => $receiverNumber,
                    'mfs_transaction_id' => $validated['mfs_transaction_id'],
                    'mfs_type' => MfsType::from($validated['mfs_type']),
                    'amount' => $payment->amount,
                ]);

                // Update payment status to under manual review
                $payment->update([
                    'status' => PaymentStatus::UNDER_MANUAL_REVIEW,
                    'gateway_response' => array_merge($payment->gateway_response ?? [], [
                        'mfs_submission' => [
                            'mfs_type' => $validated['mfs_type'],
                            'sender_number' => $validated['sender_number'],
                            'mfs_transaction_id' => $validated['mfs_transaction_id'],
                            'submitted_at' => now()->toIso8601String(),
                        ],
                    ]),
                ]);

                Log::info('MFS Manual payment submitted for review', [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'mfs_type' => $validated['mfs_type'],
                ]);

                return redirect($this->getRedirectUrl($payment))
                    ->with('success', 'Payment submitted successfully! Your payment is under manual review. You will be notified once verified.');
            });
        } catch (\Exception $e) {
            Log::error('MFS Manual payment submission error: '.$e->getMessage(), [
                'transaction_id' => $validated['transaction_id'] ?? null,
                'exception' => $e,
            ]);

            return redirect()->back()->with('error', 'An error occurred while submitting payment. Please try again.');
        }
    }
}
