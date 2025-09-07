<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RankList>
 */
class RankListFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tracker_id' => \App\Models\Tracker::factory(),
            'keyword' => fake()->unique()->slug(2),
            'description' => fake()->sentence(),
            'weight_of_upsolve' => fake()->randomFloat(2, 0.1, 1.0),
            'order' => fake()->numberBetween(0, 100),
            'is_active' => fake()->boolean(80), // 80% chance of being active
            'consider_strict_attendance' => fake()->boolean(70), // 70% chance of strict attendance
        ];
    }
}
