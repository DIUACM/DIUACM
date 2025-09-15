<?php

namespace Database\Factories;

use App\Enums\ContestType;
use App\Models\Contest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contest>
 */
class ContestFactory extends Factory
{
    protected $model = Contest::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->sentence(3),
            'contest_type' => fake()->randomElement(ContestType::cases()),
            'location' => fake()->optional(0.6)->city(),
            'date' => fake()->optional(0.9)->dateTimeBetween('-1 year', '+1 year'),
            'description' => fake()->optional(0.7)->paragraphs(2, true),
            'standings_url' => fake()->optional(0.4)->url(),
        ];
    }
}
