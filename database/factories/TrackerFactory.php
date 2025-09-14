<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tracker>
 */
class TrackerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->words(3, true);

        return [
            'title' => $title,
            'slug' => str($title)->slug(),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement([VisibilityStatus::DRAFT, VisibilityStatus::PUBLISHED]),
            'order' => fake()->numberBetween(0, 100),
        ];
    }
}
