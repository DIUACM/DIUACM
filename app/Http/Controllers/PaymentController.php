<?php

namespace App\Http\Controllers;

use App\Models\InternalContestRegistration;
use App\Services\PaymentService;
use Illuminate\Http\Request;

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
}
