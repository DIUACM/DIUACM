<?php

use App\Models\Event;
use App\Models\EventUserStat;
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

// Event Details Page Tests

it('shows event details page for published events', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'title' => 'Test Event',
        'description' => 'Test Description',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => false,
        'type' => 'class',
    ]);

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('event')
        ->where('event.id', $event->id)
        ->where('event.title', 'Test Event')
        ->where('event.description', 'Test Description')
    );
});

it('returns 404 for draft events', function () {
    $event = Event::factory()->create([
        'status' => 'draft',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get("/events/{$event->id}");

    $response->assertNotFound();
});

it('shows attendance data when attendance is enabled', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => true,
    ]);

    // Create users and attach them as attendees
    $users = User::factory()->count(3)->create();
    foreach ($users as $user) {
        $event->attendees()->attach($user->id, ['created_at' => now()->subMinutes(rand(10, 60))]);
    }

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('attendees', 3)
        ->has('attendees_count')
        ->where('attendees_count', 3)
        ->has('attendees.0', fn ($attendee) => $attendee->hasAll(['id', 'name', 'username', 'student_id', 'department', 'profile_picture', 'attended_at'])
        )
    );
});

it('does not show attendance data when attendance is disabled', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => false,
    ]);

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->missing('attendees')
        ->missing('attendees_count')
    );
});

it('shows performance data for contest events', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'type' => 'contest',
    ]);

    // Create users and their performance stats
    $users = User::factory()->count(3)->create();
    foreach ($users as $index => $user) {
        EventUserStat::factory()->create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'solve_count' => 10 - $index, // Descending order for testing
            'upsolve_count' => $index + 1,
            'participation' => true,
        ]);
    }

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('performance_data', 3)
        ->has('performance_count')
        ->where('performance_count', 3)
        ->has('performance_data.0', fn ($performance) => $performance->hasAll(['user', 'solve_count', 'upsolve_count', 'participation', 'total_count'])
            ->has('user', fn ($user) => $user->hasAll(['id', 'name', 'username', 'student_id', 'department', 'profile_picture'])
            )
            ->where('solve_count', 10) // First user should have highest solve count
        )
    );
});

it('does not show performance data for non-contest events', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'type' => 'class',
    ]);

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->missing('performance_data')
        ->missing('performance_count')
    );
});

it('shows both attendance and performance data for contest with attendance enabled', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => true,
        'type' => 'contest',
    ]);

    // Create users
    $users = User::factory()->count(2)->create();

    // Add attendance
    foreach ($users as $user) {
        $event->attendees()->attach($user->id, ['created_at' => now()->subMinutes(30)]);
    }

    // Add performance stats
    foreach ($users as $index => $user) {
        EventUserStat::factory()->create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'solve_count' => 5 - $index,
            'upsolve_count' => $index + 1,
            'participation' => true,
        ]);
    }

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('attendees', 2)
        ->where('attendees_count', 2)
        ->has('performance_data', 2)
        ->where('performance_count', 2)
    );
});

it('sorts performance data by solve count then upsolve count', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'type' => 'contest',
    ]);

    $users = User::factory()->count(3)->create();

    // Create stats with intentional ordering
    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $users[0]->id,
        'solve_count' => 5,
        'upsolve_count' => 2,
        'participation' => true,
    ]);

    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $users[1]->id,
        'solve_count' => 10,
        'upsolve_count' => 1,
        'participation' => true,
    ]);

    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $users[2]->id,
        'solve_count' => 5,
        'upsolve_count' => 5,
        'participation' => true,
    ]);

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('performance_data', 3)
        ->where('performance_data.0.solve_count', 10) // User with highest solve count first
        ->where('performance_data.1.solve_count', 5)
        ->where('performance_data.1.upsolve_count', 5) // Among users with same solve count, higher upsolve count first
        ->where('performance_data.2.solve_count', 5)
        ->where('performance_data.2.upsolve_count', 2)
    );
});

it('shows attendance section without tabs when only attendance is available', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => true,
        'type' => 'class', // Not a contest, so no performance data
    ]);

    // Create attendees
    $users = User::factory()->count(2)->create();
    foreach ($users as $user) {
        $event->attendees()->attach($user->id, ['created_at' => now()->subMinutes(30)]);
    }

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('attendees', 2)
        ->where('attendees_count', 2)
        ->missing('performance_data')
        ->missing('performance_count')
    );
});

it('shows performance section without tabs when only performance is available', function () {
    $event = Event::factory()->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
        'open_for_attendance' => false, // No attendance tracking
        'type' => 'contest',
    ]);

    // Create performance stats
    $users = User::factory()->count(2)->create();
    foreach ($users as $index => $user) {
        EventUserStat::factory()->create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'solve_count' => 5 - $index,
            'upsolve_count' => $index + 1,
            'participation' => true,
        ]);
    }

    $response = get("/events/{$event->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('events/show')
        ->has('performance_data', 2)
        ->where('performance_count', 2)
        ->missing('attendees')
        ->missing('attendees_count')
    );
});
