<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Illuminate\Database\Seeder;

class RankListSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating Rank Lists...');

        $trackers = Tracker::all();
        $events = Event::all();
        $users = User::all();

        $rankLists = collect();

        // Create 2-4 rank lists per tracker
        foreach ($trackers as $tracker) {
            $rankListCount = rand(2, 4);

            for ($i = 0; $i < $rankListCount; $i++) {
                $rankList = RankList::factory()->create([
                    'tracker_id' => $tracker->id,
                    'order' => $i + 1,
                ]);

                $rankLists->push($rankList);
            }
        }

        $this->command->info('Associating Rank Lists with Events...');

        // Associate rank lists with events
        foreach ($rankLists as $rankList) {
            // Randomly assign 1-5 events to each rank list
            $eventCount = rand(1, 5);
            $selectedEvents = $events->random(min($eventCount, $events->count()));

            foreach ($selectedEvents as $event) {
                $rankList->events()->attach($event->id, [
                    'weight' => fake()->randomFloat(2, 0.5, 2.0),
                ]);
            }
        }

        $this->command->info('Creating User Rankings...');

        // Create user rankings for active rank lists
        $activeRankLists = $rankLists->where('is_active', true);

        foreach ($activeRankLists as $rankList) {
            // Randomly assign scores to 20-50 users
            $userCount = rand(20, 50);
            $selectedUsers = $users->random(min($userCount, $users->count()));

            foreach ($selectedUsers as $index => $user) {
                $rankList->users()->attach($user->id, [
                    'score' => fake()->randomFloat(2, 0, 1000),
                ]);
            }
        }

        $this->command->info('✅ Rank Lists seeded successfully!');
        $this->command->info("   - {$rankLists->count()} Rank Lists created");
        $this->command->info('   - Events associated with rank lists');
        $this->command->info('   - User rankings created for active rank lists');
    }
}
