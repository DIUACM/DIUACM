<?php

use App\Enums\PaymentStatus;
use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use App\Models\Payment;
use App\Models\User;

use function Pest\Laravel\mock;

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

it('handles successful IPN notification', function () {
    $transactionId = 'TEST_'.uniqid();

    $payment = Payment::factory()->create([
        'payable_type' => InternalContestRegistration::class,
        'payable_id' => $this->registration->id,
        'gateway' => 'sslcommerz',
        'transaction_id' => $transactionId,
        'gateway_transaction_id' => $transactionId,
        'amount' => 500,
        'status' => PaymentStatus::PENDING,
    ]);

    $ipnData = [
        'tran_id' => $transactionId,
        'val_id' => 'TEST_VAL_ID',
        'status' => 'VALID',
        'amount' => '500.00',
        'currency' => 'BDT',
        'bank_tran_id' => 'BANK_'.uniqid(),
        'card_type' => 'VISA',
        'verify_sign' => md5('test'),
        'verify_key' => 'tran_id,val_id,amount',
    ];

    // Mock the SSL Commerz validation at the gateway level
    $gatewayMock = $this->mock(\App\Services\PaymentGateways\SslCommerzGateway::class, function ($mock) use ($transactionId, $ipnData) {
        $mock->shouldReceive('handleCallback')
            ->once()
            ->with($ipnData)
            ->andReturn([
                'success' => true,
                'status' => 'Completed',
                'transaction_id' => $transactionId,
                'gateway_transaction_id' => $transactionId,
                'bank_transaction_id' => $ipnData['bank_tran_id'],
                'amount' => 500,
                'currency' => 'BDT',
                'response' => $ipnData,
            ]);
    });

    $response = $this->postJson(route('payment.ipn', ['gateway' => 'sslcommerz']), $ipnData);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'success',
            'message' => 'IPN processed successfully',
        ]);

    expect($payment->refresh()->status)->toBe(PaymentStatus::PAID);
});

it('handles failed IPN notification', function () {
    $transactionId = 'TEST_'.uniqid();

    $payment = Payment::factory()->create([
        'payable_type' => InternalContestRegistration::class,
        'payable_id' => $this->registration->id,
        'gateway' => 'sslcommerz',
        'transaction_id' => $transactionId,
        'gateway_transaction_id' => $transactionId,
        'amount' => 500,
        'status' => PaymentStatus::PENDING,
    ]);

    $ipnData = [
        'tran_id' => $transactionId,
        'status' => 'FAILED',
        'amount' => '500.00',
        'currency' => 'BDT',
        'error' => 'Payment declined by bank',
    ];

    $response = $this->postJson(route('payment.ipn', ['gateway' => 'sslcommerz']), $ipnData);

    $response->assertStatus(200);

    expect($payment->refresh()->status)->toBe(PaymentStatus::FAILED);
});

it('handles cancelled IPN notification', function () {
    $transactionId = 'TEST_'.uniqid();

    $payment = Payment::factory()->create([
        'payable_type' => InternalContestRegistration::class,
        'payable_id' => $this->registration->id,
        'gateway' => 'sslcommerz',
        'transaction_id' => $transactionId,
        'gateway_transaction_id' => $transactionId,
        'amount' => 500,
        'status' => PaymentStatus::PENDING,
    ]);

    $ipnData = [
        'tran_id' => $transactionId,
        'status' => 'CANCELLED',
        'amount' => '500.00',
        'currency' => 'BDT',
    ];

    $response = $this->postJson(route('payment.ipn', ['gateway' => 'sslcommerz']), $ipnData);

    $response->assertStatus(200);

    expect($payment->refresh()->status)->toBe(PaymentStatus::CANCELED);
});

it('ignores IPN for already paid payment', function () {
    $transactionId = 'TEST_'.uniqid();

    $payment = Payment::factory()->create([
        'payable_type' => InternalContestRegistration::class,
        'payable_id' => $this->registration->id,
        'gateway' => 'sslcommerz',
        'transaction_id' => $transactionId,
        'gateway_transaction_id' => $transactionId,
        'amount' => 500,
        'status' => PaymentStatus::PAID,
    ]);

    $ipnData = [
        'tran_id' => $transactionId,
        'val_id' => 'TEST_VAL_ID',
        'status' => 'VALID',
        'amount' => '500.00',
        'currency' => 'BDT',
    ];

    // Mock the SSL Commerz gateway
    $this->mock(\App\Services\PaymentGateways\SslCommerzGateway::class, function ($mock) use ($transactionId, $ipnData) {
        $mock->shouldReceive('handleCallback')
            ->once()
            ->with($ipnData)
            ->andReturn([
                'success' => true,
                'status' => 'Completed',
                'transaction_id' => $transactionId,
                'gateway_transaction_id' => $transactionId,
                'amount' => 500,
                'currency' => 'BDT',
                'response' => $ipnData,
            ]);
    });

    $response = $this->postJson(route('payment.ipn', ['gateway' => 'sslcommerz']), $ipnData);

    $response->assertStatus(200);

    // Status should remain paid
    expect($payment->refresh()->status)->toBe(PaymentStatus::PAID);
});

it('returns error for invalid IPN data', function () {
    $ipnData = [
        'invalid' => 'data',
    ];

    $response = $this->postJson(route('payment.ipn', ['gateway' => 'sslcommerz']), $ipnData);

    $response->assertStatus(400)
        ->assertJson([
            'status' => 'error',
        ]);
});
