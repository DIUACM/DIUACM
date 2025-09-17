<?php

namespace Database\Factories;

use App\Models\Contest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $teamNameFormats = [
            'Team Alpha',
            'Code Warriors',
            'Binary Builders',
            'Algorithm Architects',
            'Debug Masters',
            'Logic Lords',
            'Syntax Squad',
            'Byte Brigade',
            'Code Crusaders',
            'Data Dynamos',
            'Tech Titans',
            'Pixel Pirates',
            'Quantum Coders',
            'Digital Dragons',
            'Cyber Champions',
            'Runtime Raiders',
            'Script Soldiers',
            'Function Force',
            'Variable Victors',
            'Loop Legends',
            'Array Avengers',
            'Stack Smashers',
            'Queue Questers',
            'Tree Traversers',
            'Graph Guardians',
            'Hash Heroes',
            'Sort Sorcerers',
            'Search Specialists',
            'Recursion Rangers',
            'Dynamic Dynamos',
        ];

        $universities = ['DIU', 'BUET', 'DU', 'CUET', 'RUET', 'SUST', 'UIU', 'NSU', 'BRAC', 'IUT', 'AIUB', 'AUST', 'EWU'];

        $baseName = fake()->randomElement($teamNameFormats);
        $university = fake()->randomElement($universities);
        $uniqueId = fake()->unique()->randomNumber(4);

        // Create unique name by combining university, base name and unique ID
        $teamName = $university.' '.$baseName.' #'.$uniqueId;

        return [
            'name' => $teamName,
            'contest_id' => Contest::factory(),
            'rank' => fake()->numberBetween(1, 100),
            'solve_count' => fake()->numberBetween(0, 12),
        ];
    }

    /**
     * Indicate that the team should be a winning team.
     */
    public function winner(): static
    {
        return $this->state(fn (array $attributes) => [
            'rank' => fake()->numberBetween(1, 3),
            'solve_count' => fake()->numberBetween(8, 12),
        ]);
    }

    /**
     * Indicate that the team should be a top performer.
     */
    public function topPerformer(): static
    {
        return $this->state(fn (array $attributes) => [
            'rank' => fake()->numberBetween(1, 10),
            'solve_count' => fake()->numberBetween(6, 12),
        ]);
    }

    /**
     * Indicate that the team should be from DIU.
     */
    public function diuTeam(): static
    {
        $diuTeamNames = [
            'DIU Code Mavericks',
            'DIU Algorithm Experts',
            'DIU Programming Pros',
            'DIU Tech Innovators',
            'DIU Digital Warriors',
            'DIU Logic Masters',
            'DIU Binary Heroes',
        ];

        return $this->state(fn (array $attributes) => [
            'name' => fake()->randomElement($diuTeamNames).' #'.fake()->unique()->randomNumber(4),
        ]);
    }

    /**
     * Set specific rank for the team.
     */
    public function rank(int $rank): static
    {
        return $this->state(fn (array $attributes) => [
            'rank' => $rank,
        ]);
    }

    /**
     * Set specific solve count for the team.
     */
    public function solveCount(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'solve_count' => $count,
        ]);
    }
}
