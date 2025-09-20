<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventUserStat>
 */
class EventUserStatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $participation = fake()->boolean(85); // 85% chance of participation
        $solveCount = $participation ? fake()->numberBetween(0, 12) : 0;
        $upsolveCount = $participation ? fake()->numberBetween(0, max(0, 15 - $solveCount)) : 0;

        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'solve_count' => $solveCount,
            'upsolve_count' => $upsolveCount,
            'participation' => $participation,
        ];
    }

    /**
     * Indicate that the user participated in the event.
     */
    public function participated(): static
    {
        return $this->state(fn (array $attributes) => [
            'participation' => true,
            'solve_count' => fake()->numberBetween(1, 12),
            'upsolve_count' => fake()->numberBetween(0, 8),
        ]);
    }

    /**
     * Indicate that the user did not participate in the event.
     */
    public function notParticipated(): static
    {
        return $this->state(fn (array $attributes) => [
            'participation' => false,
            'solve_count' => 0,
            'upsolve_count' => 0,
        ]);
    }

    /**
     * Indicate that the user is a high performer.
     */
    public function highPerformer(): static
    {
        return $this->state(fn (array $attributes) => [
            'participation' => true,
            'solve_count' => fake()->numberBetween(8, 12),
            'upsolve_count' => fake()->numberBetween(3, 10),
        ]);
    }

    /**
     * Set specific solve count for the user.
     */
    public function solveCount(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'solve_count' => $count,
            'participation' => $count > 0,
        ]);
    }

    /**
     * Set specific upsolve count for the user.
     */
    public function upsolveCount(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'upsolve_count' => $count,
        ]);
    }
}
