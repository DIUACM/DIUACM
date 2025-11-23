<?php

namespace Database\Seeders;

use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;

class InternalContestRegistrationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🎫 Creating Internal Contest Registrations...');

        // Clear existing registrations
        $existingCount = InternalContestRegistration::count();
        if ($existingCount > 0) {
            $this->command->info("🗑️  Clearing {$existingCount} existing registrations...");
            InternalContestRegistration::truncate();
        }

        // Get all internal contests
        $contests = InternalContest::all();

        if ($contests->count() < 2) {
            $this->command->warn('⚠️  Need at least 2 contests. Found: '.$contests->count());

            return;
        }

        // Get all users
        $users = User::all();

        if ($users->count() < 1000) {
            $this->command->warn('⚠️  Need at least 1000 users for unique registrations. Found: '.$users->count());

            return;
        }

        $this->command->info("📊 Found {$contests->count()} contests and {$users->count()} users");

        // Get the first two contests
        $contest1 = $contests->first();
        $contest2 = $contests->skip(1)->first();

        // Split users - first 500 for contest 1, next 500 for contest 2
        $users1 = $users->take(500);
        $users2 = $users->skip(500)->take(500);

        $this->command->info("🎯 Creating 500 registrations for: {$contest1->title}");
        $progressBar1 = $this->command->getOutput()->createProgressBar(500);

        foreach ($users1 as $user) {
            InternalContestRegistration::factory()->create([
                'internal_contest_id' => $contest1->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
            $progressBar1->advance();
        }

        $progressBar1->finish();
        $this->command->newLine();

        $this->command->info("🎯 Creating 500 registrations for: {$contest2->title}");
        $progressBar2 = $this->command->getOutput()->createProgressBar(500);

        foreach ($users2 as $user) {
            InternalContestRegistration::factory()->create([
                'internal_contest_id' => $contest2->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
            $progressBar2->advance();
        }

        $progressBar2->finish();
        $this->command->newLine();

        $this->command->info('✅ Internal Contest Registrations created successfully!');
        $this->command->info("   - Contest 1: {$contest1->title} - 500 registrations");
        $this->command->info("   - Contest 2: {$contest2->title} - 500 registrations");
        $this->command->info('   - Total: 1000 registrations');
    }
}
