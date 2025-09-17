<?php

namespace Database\Seeders;

use App\Models\Tracker;
use Illuminate\Database\Seeder;

class TrackerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating Trackers...');

        // Create 10 trackers with variety
        $trackers = collect();

        // Create 5 contest-focused trackers
        $contestTrackers = Tracker::factory(5)->contestFocused()->create();
        $trackers = $trackers->merge($contestTrackers);

        // Create 3 academic-focused trackers
        $academicTrackers = Tracker::factory(3)->academicFocused()->create();
        $trackers = $trackers->merge($academicTrackers);

        // Create 2 general trackers
        $generalTrackers = Tracker::factory(2)->published()->create();
        $trackers = $trackers->merge($generalTrackers);

        $this->command->info('✅ Trackers seeded successfully!');
        $this->command->info("   - {$trackers->count()} Trackers created");
        $this->command->info('   - 5 Contest-focused trackers');
        $this->command->info('   - 3 Academic-focused trackers');
        $this->command->info('   - 2 General trackers');
    }
}
