<?php

namespace Database\Factories;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startingAt = fake()->dateTimeBetween('now', '+6 months');
        $endingAt = fake()->dateTimeBetween($startingAt, $startingAt->format('Y-m-d H:i:s').' +4 hours');

        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(3),
            'status' => fake()->randomElement(VisibilityStatus::cases()),
            'starting_at' => $startingAt,
            'ending_at' => $endingAt,
            'event_link' => fake()->optional(0.7)->url(),
            'event_password' => fake()->optional(0.3)->password(8, 12),
            'open_for_attendance' => fake()->boolean(80),
            'strict_attendance' => fake()->boolean(30),
            'auto_update_score' => true,
            'type' => fake()->randomElement(EventType::cases()),
            'participation_scope' => fake()->randomElement(ParticipationScope::cases()),
        ];
    }
}
