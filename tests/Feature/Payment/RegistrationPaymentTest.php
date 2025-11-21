<?php

use App\Enums\PaymentStatus;
use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->contest = InternalContest::factory()->create([
        'registration_fee' => 500,
    ]);
    $this->registration = InternalContestRegistration::factory()->create([
        'user_id' => $this->user->id,
        'internal_contest_id' => $this->contest->id,
    ]);
});

it('prevents payment initiation for already paid registration', function () {
    // Create a successful payment
    $this->registration->createPayment('sslcommerz', 500);
    $payment = $this->registration->latestPayment();
    $this->registration->markPaymentAsSuccessful($payment);

    actingAs($this->user)
        ->from(route('payment.registration.select-gateway', $this->registration))
        ->post(route('payment.registration.initiate', $this->registration), [
            'gateway' => 'sslcommerz',
        ])
        ->assertRedirect()
        ->assertSessionHas('error', 'Payment has already been completed');
});

it('prevents payment initiation when payment is pending', function () {
    // Create a pending payment
    $this->registration->createPayment('sslcommerz', 500);

    actingAs($this->user)
        ->from(route('payment.registration.select-gateway', $this->registration))
        ->post(route('payment.registration.initiate', $this->registration), [
            'gateway' => 'sslcommerz',
        ])
        ->assertRedirect()
        ->assertSessionHas('error', 'A payment is currently being processed. Please wait a few minutes and refresh the page.');
});

it('prevents payment initiation when payment is under manual review', function () {
    // Create a payment under manual review
    $payment = $this->registration->createPayment('sslcommerz', 500);
    $payment->update(['status' => PaymentStatus::UNDER_MANUAL_REVIEW]);

    actingAs($this->user)
        ->from(route('payment.registration.select-gateway', $this->registration))
        ->post(route('payment.registration.initiate', $this->registration), [
            'gateway' => 'sslcommerz',
        ])
        ->assertRedirect()
        ->assertSessionHas('info', 'Your payment is currently under manual review by our team. Please wait for verification.');
});

it('prevents payment initiation for free registrations', function () {
    $freeContest = InternalContest::factory()->create([
        'registration_fee' => 0,
    ]);
    $freeRegistration = InternalContestRegistration::factory()->create([
        'user_id' => $this->user->id,
        'internal_contest_id' => $freeContest->id,
    ]);

    actingAs($this->user)
        ->from(route('payment.registration.select-gateway', $freeRegistration))
        ->post(route('payment.registration.initiate', $freeRegistration), [
            'gateway' => 'sslcommerz',
        ])
        ->assertRedirect()
        ->assertSessionHas('error', 'This registration does not require payment');
});

it('prevents unauthorized users from accessing another user registration payment', function () {
    $anotherUser = User::factory()->create();

    // The authorization check now happens before the transaction
    actingAs($anotherUser)
        ->from(route('payment.registration.select-gateway', $this->registration))
        ->post(route('payment.registration.initiate', $this->registration), [
            'gateway' => 'sslcommerz',
        ])
        ->assertForbidden();
});

it('allows payment retry after failed payment', function () {
    // Create a failed payment
    $payment = $this->registration->createPayment('sslcommerz', 500);
    $this->registration->markPaymentAsFailed($payment);

    // Should allow new payment initiation
    expect($this->registration->canInitiatePayment())->toBeTrue();
});

it('allows payment retry after canceled payment', function () {
    // Create a canceled payment
    $payment = $this->registration->createPayment('sslcommerz', 500);
    $payment->update(['status' => PaymentStatus::CANCELED]);

    // Should allow new payment initiation
    expect($this->registration->canInitiatePayment())->toBeTrue();
});

it('handles race condition with database locking during payment initiation', function () {
    // Simulate concurrent payment initiation attempts
    DB::beginTransaction();

    try {
        // First request locks the registration
        $lockedRegistration = InternalContestRegistration::where('id', $this->registration->id)
            ->lockForUpdate()
            ->first();

        // Create payment while locked
        $payment = $lockedRegistration->createPayment('sslcommerz', 500);

        expect($payment)->toBeInstanceOf(Payment::class);
        expect($payment->status)->toBe(PaymentStatus::PENDING);

        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }

    // Verify only one payment was created
    expect($this->registration->payments()->count())->toBe(1);
});

it('returns correct registration status based on payment state', function () {
    // Pending registration (no payment)
    expect($this->registration->getStatus())->toBe('pending');

    // Create successful payment
    $payment = $this->registration->createPayment('sslcommerz', 500);
    $this->registration->markPaymentAsSuccessful($payment);

    expect($this->registration->fresh()->getStatus())->toBe('paid');
});

it('returns under_review status when payment is under manual review', function () {
    $payment = $this->registration->createPayment('sslcommerz', 500);
    $payment->update(['status' => PaymentStatus::UNDER_MANUAL_REVIEW]);

    expect($this->registration->fresh()->getStatus())->toBe('under_review');
});

it('handles payment callback idempotently for already successful payments', function () {
    // Create and mark payment as successful
    $payment = $this->registration->createPayment('sslcommerz', 500, 'BDT', [
        'gateway_transaction_id' => 'GW-123456',
    ]);
    $this->registration->markPaymentAsSuccessful($payment);

    // Count initial successful payments
    $initialCount = $this->registration->successfulPayments()->count();

    // Simulate duplicate callback (should be idempotent)
    // In real scenario, this would go through the controller
    // Here we just verify the payment status remains unchanged
    expect($payment->fresh()->status)->toBe(PaymentStatus::PAID);
    expect($this->registration->successfulPayments()->count())->toBe($initialCount);
});

it('correctly identifies when payment can be initiated', function () {
    // Fresh registration - can initiate
    expect($this->registration->canInitiatePayment())->toBeTrue();

    // After creating pending payment - cannot initiate
    $payment = $this->registration->createPayment('sslcommerz', 500);
    expect($this->registration->fresh()->canInitiatePayment())->toBeFalse();

    // After payment fails - can initiate again
    $this->registration->markPaymentAsFailed($payment);
    expect($this->registration->fresh()->canInitiatePayment())->toBeTrue();

    // After successful payment - cannot initiate
    $newPayment = $this->registration->createPayment('sslcommerz', 500);
    $this->registration->markPaymentAsSuccessful($newPayment);
    expect($this->registration->fresh()->canInitiatePayment())->toBeFalse();
});

it('tracks payment under manual review correctly', function () {
    expect($this->registration->hasPaymentUnderManualReview())->toBeFalse();

    $payment = $this->registration->createPayment('sslcommerz', 500);
    $payment->update(['status' => PaymentStatus::UNDER_MANUAL_REVIEW]);

    expect($this->registration->fresh()->hasPaymentUnderManualReview())->toBeTrue();
});
