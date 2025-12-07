<?php

namespace Database\Seeders;

use App\Models\JobExperience;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobExperienceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users who have programming handles (programmers)
        $programmers = User::hasProgrammingHandle()->get();

        if ($programmers->isEmpty()) {
            $this->command->warn('No programmers found. Creating job experiences for all users instead.');
            $programmers = User::limit(50)->get();
        }

        // Create 1-3 job experiences for each programmer
        $programmers->each(function (User $user) {
            $experienceCount = rand(1, 3);

            JobExperience::factory()
                ->count($experienceCount)
                ->for($user)
                ->create();
        });

        $this->command->info('Job experiences created successfully!');
    }
}
