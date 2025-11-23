<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\InternalContestRegistration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payable_type' => InternalContestRegistration::class,
            'payable_id' => InternalContestRegistration::factory(),
            'gateway' => 'sslcommerz',
            'transaction_id' => 'TEST_'.uniqid(),
            'gateway_transaction_id' => 'TEST_'.uniqid(),
            'amount' => fake()->randomFloat(2, 10, 1000),
            'currency' => 'BDT',
            'status' => PaymentStatus::PENDING,
            'gateway_response' => [],
            'paid_at' => null,
        ];
    }

    /**
     * Indicate that the payment is paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::PAID,
            'paid_at' => now(),
        ]);
    }

    /**
     * Indicate that the payment has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::FAILED,
        ]);
    }

    /**
     * Indicate that the payment is canceled.
     */
    public function canceled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::CANCELED,
        ]);
    }
}
