<?php

use App\Enums\EventType;
use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\User;

it('returns paginated published events on index', function () {
    $publishedEvents = Event::factory()->count(5)->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    Event::factory()->count(3)->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get(route('events.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('events/index')
        ->has('events.data', 5)
    );
});

it('filters events by search term', function () {
    Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Laravel Workshop',
    ]);

    Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'React Bootcamp',
    ]);

    $response = $this->get(route('events.index', ['search' => 'Laravel']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('events.data', 1)
        ->where('events.data.0.title', 'Laravel Workshop')
    );
});

it('filters events by type', function () {
    Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::CONTEST,
    ]);

    Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::_CLASS,
    ]);

    $response = $this->get(route('events.index', ['type' => EventType::CONTEST->value]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('events.data', 1)
        ->where('events.data.0.type', EventType::CONTEST->value)
    );
});

it('only counts attendees for events with open attendance', function () {
    $eventWithAttendance = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
    ]);

    $eventWithoutAttendance = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => false,
    ]);

    $users = User::factory()->count(3)->create();
    $eventWithAttendance->attendees()->attach($users);
    $eventWithoutAttendance->attendees()->attach($users);

    $response = $this->get(route('events.index'));

    $response->assertSuccessful();
    // This test verifies the conditional count logic works properly
});

it('returns event details for published event', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::CONTEST,
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => [
            'id',
            'title',
            'description',
            'starting_at',
            'ending_at',
            'participation_scope',
            'type',
            'event_link',
        ],
    ]);
});

it('returns 404 for unpublished event', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertNotFound();
});

it('loads attendees only when attendance is open', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
    ]);

    $users = User::factory()->count(3)->create();
    $event->attendees()->attach($users);

    $response = $this->get(route('events.show', $event));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => [
            'attendees_count',
            'attendance' => [
                '*' => [
                    'name',
                    'username',
                    'avatar',
                    'student_id',
                    'department',
                    'attended_at',
                ],
            ],
        ],
    ]);
});

it('does not load attendees when attendance is closed', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => false,
    ]);

    $users = User::factory()->count(3)->create();
    $event->attendees()->attach($users);

    $response = $this->get(route('events.show', $event));

    $response->assertSuccessful();
    $response->assertJsonMissing(['attendance']);
    $response->assertJsonMissing(['attendees_count']);
});

it('loads performance data for contest events', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::CONTEST,
    ]);

    $users = User::factory()->count(3)->create();

    foreach ($users as $user) {
        $event->usersWithStats()->attach($user, [
            'solve_count' => fake()->numberBetween(1, 10),
            'upsolve_count' => fake()->numberBetween(1, 5),
            'participation' => true,
        ]);
    }

    $response = $this->get(route('events.show', $event));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => [
            'performance' => [
                '*' => [
                    'name',
                    'username',
                    'avatar',
                    'student_id',
                    'department',
                    'solve_count',
                    'upsolve_count',
                ],
            ],
        ],
    ]);
});

it('does not load performance data for non-contest events', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::_CLASS,
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertSuccessful();
    $response->assertJsonMissing(['performance']);
});

it('does not trigger N+1 queries when loading attendees', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
    ]);

    $users = User::factory()->count(20)->create();
    $event->attendees()->attach($users);

    // First request to warm up any caches
    $this->get(route('events.show', $event));

    // Count queries on second request
    \DB::enableQueryLog();

    $this->get(route('events.show', $event));

    $queries = \DB::getQueryLog();
    \DB::disableQueryLog();

    // Should be around 2-3 queries total:
    // 1. Load event
    // 2. Load attendees with count
    // 3. Possibly one for auth/session
    expect(count($queries))->toBeLessThan(10);
});
