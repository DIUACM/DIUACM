<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use App\Models\Tracker;
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
        $rankListKeywords = [
            'weekly-contest',
            'monthly-challenge',
            'algorithm-master',
            'problem-solver',
            'contest-warrior',
            'coding-champion',
            'prog-genius',
            'data-structure-expert',
            'dynamic-programming',
            'graph-algorithms',
            'string-problems',
            'number-theory',
            'geometry-challenge',
            'greedy-algorithms',
            'binary-search',
            'tree-problems',
            'competitive-prog',
            'icpc-preparation',
            'codeforces-tracker',
            'atcoder-tracker',
        ];

        $descriptions = [
            'Comprehensive ranking system tracking student performance across multiple contests and events.',
            'Performance tracker focusing on algorithm mastery and problem-solving consistency.',
            'Contest-based ranking system evaluating both solve count and upsolve dedication.',
            'Training progress tracker measuring improvement in competitive programming skills.',
            'Academic performance tracker for programming courses and workshops.',
            'Team performance evaluation system for collaborative programming challenges.',
            'Individual skill assessment tracker for various algorithmic topics.',
            'Contest participation tracker with weighted scoring system.',
            'Progress monitoring system for programming bootcamp participants.',
            'Achievement-based ranking system recognizing consistent performance and growth.',
        ];

        return [
            'tracker_id' => Tracker::factory(),
            'keyword' => fake()->randomElement($rankListKeywords).'-'.fake()->randomNumber(5).'-'.time(),
            'description' => fake()->randomElement($descriptions),
            'weight_of_upsolve' => fake()->randomFloat(2, 0.1, 1.0), // Weight between 0.1 and 1.0
            'status' => fake()->randomElement(VisibilityStatus::cases()),
            'order' => fake()->numberBetween(1, 100),
            'is_active' => fake()->boolean(80), // 80% chance of being active
            'consider_strict_attendance' => fake()->boolean(40), // 40% chance of considering strict attendance
        ];
    }

    /**
     * Indicate that the rank list should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the rank list should be active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the rank list should consider strict attendance.
     */
    public function strictAttendance(): static
    {
        return $this->state(fn (array $attributes) => [
            'consider_strict_attendance' => true,
        ]);
    }

    /**
     * Set a specific weight for upsolve.
     */
    public function upsolveWeight(float $weight): static
    {
        return $this->state(fn (array $attributes) => [
            'weight_of_upsolve' => $weight,
        ]);
    }

    /**
     * Set a specific order for the rank list.
     */
    public function order(int $order): static
    {
        return $this->state(fn (array $attributes) => [
            'order' => $order,
        ]);
    }

    /**
     * Create a contest-focused rank list.
     */
    public function contestFocused(): static
    {
        return $this->state(fn (array $attributes) => [
            'keyword' => fake()->randomElement(['contest-master', 'icpc-tracker', 'competitive-prog']),
            'description' => 'Contest performance tracker focusing on competitive programming achievements.',
            'weight_of_upsolve' => fake()->randomFloat(2, 0.3, 0.7),
            'consider_strict_attendance' => true,
        ]);
    }
}
