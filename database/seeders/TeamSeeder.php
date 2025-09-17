<?php

namespace Database\Seeders;

use App\Models\Contest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating teams for contests (2-10 teams per contest)...');

        // Get all contests
        $contests = Contest::all();

        if ($contests->isEmpty()) {
            $this->command->warn('No contests found, creating some contests first...');
            $contests = Contest::factory(20)->create();
        }

        // Get all users to assign as team members
        $users = User::all();

        if ($users->count() < 100) {
            $this->command->warn('Not enough users for team members, creating more users...');
            $additionalUsers = User::factory(200)->create();
            $users = $users->merge($additionalUsers);
        }

        $totalTeams = 0;

        foreach ($contests as $contest) {
            // Generate 2-10 teams per contest
            $teamCount = rand(2, 10);

            $this->command->info("Creating {$teamCount} teams for contest: {$contest->name}");

            for ($i = 1; $i <= $teamCount; $i++) {
                // Create team with appropriate rank and solve count
                $team = Team::factory()
                    ->rank($i)
                    ->solveCount($this->calculateSolveCount($i, $teamCount))
                    ->create(['contest_id' => $contest->id]);

                // Assign 1-3 random users to each team
                $memberCount = rand(1, 3);
                $randomUsers = $users->random($memberCount);

                $team->members()->attach($randomUsers->pluck('id'));

                $totalTeams++;
            }
        }

        $this->command->info("Created {$totalTeams} teams successfully!");
    }

    /**
     * Calculate solve count based on team rank
     */
    private function calculateSolveCount(int $rank, int $totalTeams): int
    {
        // Better teams (lower rank) solve more problems
        if ($rank <= 3) {
            return rand(8, 12); // Top 3 teams
        } elseif ($rank <= $totalTeams * 0.3) {
            return rand(5, 9); // Top 30% teams
        } elseif ($rank <= $totalTeams * 0.6) {
            return rand(2, 6); // Middle 30% teams
        } else {
            return rand(0, 3); // Bottom 40% teams
        }
    }
}
