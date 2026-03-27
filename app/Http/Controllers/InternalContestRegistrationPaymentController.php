<?php

namespace App\Http\Controllers;

use App\Models\InternalContestRegistration;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InternalContestRegistrationPaymentController extends Controller
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
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $paymentCheck['message'],
            ]);

            return redirect()->route('internal-contests.my-registration', $registration->internalContest);
        }

        $contest = $registration->internalContest;

        return Inertia::render('payments/select-gateway', [
            'registration' => [
                'id' => $registration->id,
                'name' => $registration->name,
                'email' => $registration->email,
                'amount' => $contest->registration_fee,
                'contest_title' => $contest->title,
            ],
            'payment_config' => [
                'sslcommerz_enabled' => $contest->sslcommerz_enabled,
            ],
        ]);
    }

    /**
     * Initiate payment for registration
     */
    public function initiatePayment(Request $request, InternalContestRegistration $registration)
    {
        $validated = $request->validate([
            'gateway' => 'required|string|in:sslcommerz',
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
                    Inertia::flash('toast', [
                        'type' => 'error',
                        'message' => 'Registration not found',
                    ]);

                    return redirect()->back();
                }

                // Check if can initiate new payment
                $paymentCheck = $registration->canInitiateNewPayment();

                if (! $paymentCheck['can_pay']) {
                    $flashType = $paymentCheck['reason'] === 'under_review' ? 'info' : 'error';

                    Inertia::flash('toast', [
                        'type' => $flashType,
                        'message' => $paymentCheck['message'],
                    ]);

                    return redirect()->back();
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

                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => $result['message'] ?? 'Payment initiation failed',
                ]);

                return redirect()->back();
            });
        } catch (\Exception $e) {
            Log::error('Payment initiation error: '.$e->getMessage(), [
                'registration_id' => $registration->id,
                'user_id' => auth()->id(),
                'exception' => $e,
            ]);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'An error occurred while initiating payment. Please try again.',
            ]);

            return redirect()->back();
        }
    }

    /**
     * Get redirect URL for registration payment
     */
    public function getRedirectUrl(InternalContestRegistration $registration): string
    {
        return route('internal-contests.my-registration', [
            'internalContest' => $registration->internalContest->slug,
        ]);
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
}
