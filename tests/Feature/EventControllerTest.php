<?php

use App\Models\Event;
use App\Models\User;

use function Pest\Laravel\get;

it('loads events index page with only required fields', function () {
    // Create test events
    $events = Event::factory()->count(3)->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    // Create some attendees for the first event
    $users = User::factory()->count(2)->create();
    $events->first()->attendees()->attach($users);

    $response = get('/events');

    $response->assertSuccessful();

    // Verify the response contains the events
    $response->assertInertia(fn ($page) => $page->component('events/index')
        ->has('events.data', 3)
        ->has('events.data.0', fn ($event) => $event->hasAll(['id', 'title', 'starting_at', 'ending_at', 'participation_scope', 'type', 'attendees_count'])
            ->where('attendees_count', 2) // First event should have 2 attendees
        )
    );
});

it('filters events by search term', function () {
    Event::factory()->create([
        'title' => 'Programming Contest',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'title' => 'Algorithm Workshop',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'title' => 'Data Structure Class',
        'description' => 'Learn Python programming',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events?search=Programming');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('events.data', 2) // Should find 2 events with "Programming"
    );
});

it('filters events by type', function () {
    Event::factory()->create([
        'type' => 'contest',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'type' => 'class',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'type' => 'contest',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events?type=contest');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('events.data', 2) // Should find 2 contest events
    );
});

it('filters events by participation scope', function () {
    Event::factory()->create([
        'participation_scope' => 'open_for_all',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'participation_scope' => 'only_girls',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'participation_scope' => 'open_for_all',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events?participation_scope=open_for_all');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('events.data', 2) // Should find 2 open_for_all events
    );
});

it('only shows published events', function () {
    Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'status' => 'draft',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('events.data', 2) // Should only find 2 published events
    );
});
