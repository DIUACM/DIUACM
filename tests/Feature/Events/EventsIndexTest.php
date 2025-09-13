<?php

use App\Enums\VisibilityStatus;
use App\Models\Event;
use Inertia\Testing\AssertableInertia as Assert;

it('renders events index with pagination', function () {
    Event::factory()->count(12)->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = test()->get('/events');

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('events/index')
        ->has('events')
        ->has('pagination', fn (Assert $p) => $p
            ->where('page', 1)
            ->where('limit', 10)
            ->etc()
        )
    );
});

it('applies filters by title', function () {
    Event::factory()->create(['title' => 'Alpha Event', 'status' => VisibilityStatus::PUBLISHED]);
    Event::factory()->create(['title' => 'Beta Contest', 'status' => VisibilityStatus::PUBLISHED]);

    test()->get('/events?title=Alpha')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('events/index')
            ->has('events', 1)
        );
});
