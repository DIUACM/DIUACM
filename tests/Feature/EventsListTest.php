<?php

use App\Models\Event;

use function Pest\Laravel\get;

it('can display events index page', function () {
    // Create a few test events
    Event::factory()->count(3)->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('events/index')
            ->has('events.data')
            ->has('events.current_page')
            ->has('events.last_page')
            ->has('filters');
    });
});

it('can filter events by search term', function () {
    Event::factory()->create([
        'title' => 'Programming Contest',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    Event::factory()->create([
        'title' => 'Math Workshop',
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events?search=Programming');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('events/index')
            ->where('filters.search', 'Programming');
    });
});

it('can filter events by type', function () {
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

    $response = get('/events?type=contest');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('events/index')
            ->where('filters.type', 'contest');
    });
});

it('can filter events by participation scope', function () {
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

    $response = get('/events?participation_scope=only_girls');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('events/index')
            ->where('filters.participation_scope', 'only_girls');
    });
});

it('can paginate events', function () {
    Event::factory()->count(15)->create([
        'status' => 'published',
        'starting_at' => now()->addDays(1),
        'ending_at' => now()->addDays(1)->addHours(2),
    ]);

    $response = get('/events?page=2');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('events/index')
            ->has('events.data')
            ->where('events.current_page', 2);
    });
});
