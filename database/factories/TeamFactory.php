<?php

namespace Database\Factories;

use App\Models\Contest;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'name' => 'Team '.fake()->unique()->company(),
            'contest_id' => Contest::factory(),
            'rank' => fake()->optional(0.5)->numberBetween(1, 150),
            'solve_count' => fake()->optional(0.8)->numberBetween(0, 20),
        ];
    }
}
