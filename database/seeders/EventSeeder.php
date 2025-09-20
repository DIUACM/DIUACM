<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating Events...');

        // Create 50 events with variety
        $events = collect();

        // Create 20 past events
        $pastEvents = Event::factory(20)->past()->published()->create();
        $events = $events->merge($pastEvents);

        // Create 15 upcoming events
        $upcomingEvents = Event::factory(15)->upcoming()->published()->create();
        $events = $events->merge($upcomingEvents);

        // Create 10 contest events
        $contestEvents = Event::factory(10)->contest()->published()->create();
        $events = $events->merge($contestEvents);

        // Create 5 class events
        $classEvents = Event::factory(5)->class()->published()->create();
        $events = $events->merge($classEvents);

        $this->command->info('Creating Event Attendees...');

        // Add attendees to events
        $users = User::all();
        foreach ($events as $event) {
            // Randomly assign 10-50 attendees to each event
            $attendeeCount = rand(10, 50);
            $attendees = $users->random(min($attendeeCount, $users->count()));

            $event->attendees()->attach($attendees->pluck('id'));
        }

        $this->command->info('✅ Events seeded successfully!');
        $this->command->info("   - {$events->count()} Events created");
        $this->command->info('   - Attendees assigned to all events');
    }
}
