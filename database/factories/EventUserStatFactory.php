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
        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'solves_count' => $this->faker->numberBetween(0, 20),
            'upsolves_count' => $this->faker->numberBetween(0, 20),
            'participation' => $this->faker->boolean(),
        ];
    }
}
