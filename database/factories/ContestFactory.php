<?php

namespace Database\Factories;

use App\Enums\ContestType;
use App\Models\Gallery;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contest>
 */
class ContestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $contestTypes = [
            'ICPC Regional Contest',
            'ICPC Asia West Contest',
            'IUPC Programming Contest',
            'DIU Intra University Programming Contest',
            'ACM Programming Contest',
            'Codeforces Round',
            'AtCoder Beginner Contest',
            'Training Contest',
            'Mock Contest',
            'Final Contest',
            'Spring Programming Contest',
            'Fall Programming Contest',
            'Winter Programming Contest',
            'Summer Programming Contest',
            'Monthly Programming Contest',
            'Weekly Programming Contest',
        ];

        $locations = [
            'DIU Auditorium',
            'Computer Lab 1',
            'Computer Lab 2',
            'Main Campus',
            'Green Road Campus',
            'Satarkul Campus',
            'Online',
            'Hybrid',
        ];

        $baseContestName = fake()->randomElement($contestTypes);
        $year = fake()->year();
        $month = fake()->monthName();
        $uniqueId = fake()->randomNumber(4);

        // Create unique name by combining base name, year, month and unique ID
        $name = $baseContestName.' '.$month.' '.$year.' #'.$uniqueId;

        $hasStandings = fake()->boolean(60); // 60% chance of having standings

        return [
            'name' => $name,
            'gallery_id' => Gallery::factory(),
            'contest_type' => fake()->randomElement(ContestType::cases()),
            'location' => fake()->randomElement($locations),
            'date' => fake()->dateTimeBetween('-2 years', '+6 months'),
            'description' => fake()->paragraphs(rand(2, 4), true),
            'standings_url' => $hasStandings ? fake()->url() : null,
        ];
    }

    /**
     * Indicate that the contest should be an ICPC Regional contest.
     */
    public function icpcRegional(): static
    {
        return $this->state(fn (array $attributes) => [
            'contest_type' => ContestType::ICPCRegional,
            'name' => 'ICPC Regional Contest '.fake()->monthName().' '.fake()->year().' #'.fake()->randomNumber(4),
            'location' => fake()->randomElement(['DIU Auditorium', 'Main Campus']),
        ]);
    }

    /**
     * Indicate that the contest should be an IUPC contest.
     */
    public function iupc(): static
    {
        return $this->state(fn (array $attributes) => [
            'contest_type' => ContestType::IUPC,
            'name' => 'IUPC '.fake()->monthName().' '.fake()->year().' #'.fake()->randomNumber(4),
            'location' => fake()->randomElement(['Computer Lab 1', 'Computer Lab 2']),
        ]);
    }

    /**
     * Indicate that the contest should have standings URL.
     */
    public function withStandings(): static
    {
        return $this->state(fn (array $attributes) => [
            'standings_url' => fake()->url(),
        ]);
    }

    /**
     * Indicate that the contest should be recent.
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'date' => fake()->dateTimeBetween('-3 months', 'now'),
        ]);
    }
}
