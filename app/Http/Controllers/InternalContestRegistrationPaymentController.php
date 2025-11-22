<?php

namespace App\Http\Controllers;

use App\Models\InternalContestRegistration;
use App\Models\Payment;
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
            return redirect()
                ->route('internal-contests.my-registration', $registration->internalContest)
                ->with('error', $paymentCheck['message']);
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
                'mfs_manual_enabled' => $contest->bkash_enabled || $contest->rocket_enabled || $contest->nagad_enabled,
            ],
        ]);
    }

    /**
     * Initiate payment for registration
     */
    public function initiatePayment(Request $request, InternalContestRegistration $registration)
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

    /**
     * Get MFS configuration for a registration
     */
    public function getMfsConfig(InternalContestRegistration $registration): array
    {
        $contest = $registration->internalContest;
        $mfsTypes = [];
        $receiverNumbers = [];
        $instructions = [];

        if ($contest->bkash_enabled && $contest->bkash_receiver_number) {
            $mfsTypes[] = ['value' => 'bkash', 'label' => 'bKash'];
            $receiverNumbers['bkash'] = $contest->bkash_receiver_number;
            $instructions['bkash'] = $contest->bkash_instruction;
        }

        if ($contest->rocket_enabled && $contest->rocket_receiver_number) {
            $mfsTypes[] = ['value' => 'rocket', 'label' => 'Rocket'];
            $receiverNumbers['rocket'] = $contest->rocket_receiver_number;
            $instructions['rocket'] = $contest->rocket_instruction;
        }

        if ($contest->nagad_enabled && $contest->nagad_receiver_number) {
            $mfsTypes[] = ['value' => 'nagad', 'label' => 'Nagad'];
            $receiverNumbers['nagad'] = $contest->nagad_receiver_number;
            $instructions['nagad'] = $contest->nagad_instruction;
        }

        return [
            'mfs_types' => $mfsTypes,
            'receiver_numbers' => $receiverNumbers,
            'instructions' => $instructions,
            'payable_info' => [
                'type' => $registration->getMorphClass(),
                'name' => $registration->name ?? 'N/A',
                'email' => $registration->email ?? 'N/A',
                'contest_title' => $contest->title,
            ],
        ];
    }

    /**
     * Get receiver number for a specific MFS type
     */
    public function getReceiverNumber(InternalContestRegistration $registration, string $mfsType): ?string
    {
        $contest = $registration->internalContest;

        return match ($mfsType) {
            'bkash' => $contest->bkash_receiver_number,
            'rocket' => $contest->rocket_receiver_number,
            'nagad' => $contest->nagad_receiver_number,
            default => null,
        };
    }
}
