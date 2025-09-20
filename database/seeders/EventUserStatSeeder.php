<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventUserStatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating Event User Stats...');

        $events = Event::all();
        $users = User::all();
        $statsCreated = 0;

        foreach ($events as $event) {
            // For each event, create stats for 15-40 users
            $userCount = rand(15, 40);
            $selectedUsers = $users->random(min($userCount, $users->count()));

            foreach ($selectedUsers as $user) {
                // Check if this user-event combination already exists
                $existingStat = EventUserStat::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();

                if (! $existingStat) {
                    // 80% chance the user participated
                    if (fake()->boolean(80)) {
                        EventUserStat::factory()->participated()->create([
                            'event_id' => $event->id,
                            'user_id' => $user->id,
                        ]);
                    } else {
                        EventUserStat::factory()->notParticipated()->create([
                            'event_id' => $event->id,
                            'user_id' => $user->id,
                        ]);
                    }

                    $statsCreated++;
                }
            }
        }

        // Create some high performers
        $this->command->info('Creating High Performer Stats...');

        $highPerformerCount = min(100, $statsCreated / 10); // 10% high performers
        EventUserStat::factory($highPerformerCount)->highPerformer()->create();

        $this->command->info('✅ Event User Stats seeded successfully!');
        $this->command->info("   - {$statsCreated} Event User Stats created");
        $this->command->info("   - {$highPerformerCount} High Performer Stats created");
        $this->command->info('   - Stats distributed across all events');
    }
}
