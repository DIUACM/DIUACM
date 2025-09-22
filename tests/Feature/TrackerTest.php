<?php

use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;

use function Pest\Laravel\get;

it('displays tracker index page with published trackers', function () {
    // Create published and draft trackers
    $publishedTracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Published Tracker',
        'order' => 1,
    ]);

    $draftTracker = Tracker::factory()->create([
        'status' => VisibilityStatus::DRAFT,
        'title' => 'Draft Tracker',
        'order' => 2,
    ]);

    $response = get('/trackers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('trackers/index')
            ->has('trackers.data', 1) // Only published tracker should appear
            ->where('trackers.data.0.title', 'Published Tracker');
    });
});

it('allows searching trackers by title', function () {
    Tracker::factory()->create([
        'title' => 'Programming Contest Tracker',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    Tracker::factory()->create([
        'title' => 'Mathematics Competition',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = get('/trackers?search=Programming Contest');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('trackers/index')
            ->has('trackers.data', 1)
            ->where('trackers.data.0.title', 'Programming Contest Tracker');
    });
});

it('allows searching trackers by description', function () {
    Tracker::factory()->create([
        'title' => 'Contest Tracker',
        'description' => 'Track programming contest performance',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    Tracker::factory()->create([
        'title' => 'Math Tracker',
        'description' => 'Track mathematics competition results',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = get('/trackers?search=programming');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('trackers/index')
            ->has('trackers.data', 1)
            ->where('trackers.data.0.title', 'Contest Tracker');
    });
});

it('displays tracker show page with rank list data', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Test Tracker',
        'slug' => 'test-tracker',
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'overall',
    ]);

    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Test Contest',
    ]);

    $user = User::factory()->create(['name' => 'Test User']);

    // Attach relationships with required weight
    $rankList->events()->attach($event->id, ['weight' => 1.0]);
    $rankList->users()->attach($user->id, ['score' => 100.5]);

    // Create event stats
    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'solve_count' => 5,
        'upsolve_count' => 2,
        'participation' => true,
    ]);

    $response = get("/trackers/{$tracker->slug}");

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('trackers/show')
            ->where('tracker.title', 'Test Tracker')
            ->where('selectedRankList.keyword', 'overall')
            ->has('selectedRankList.events', 1)
            ->has('selectedRankList.users', 1)
            ->where('selectedRankList.users.0.name', 'Test User')
            ->where('selectedRankList.users.0.score', 100.5);
    });
});

it('allows switching between rank lists using keyword parameter', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'slug' => 'test-tracker',
    ]);

    $rankList1 = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'junior',
    ]);

    $rankList2 = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'overall',
    ]);

    // Test default (first rank list created - junior)
    $response = get("/trackers/{$tracker->slug}");
    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->where('selectedRankList.keyword', 'junior');
    });

    // Test specific rank list
    $response = get("/trackers/{$tracker->slug}?keyword=overall");
    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->where('selectedRankList.keyword', 'overall');
    });
});

it('returns 404 for unpublished tracker', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::DRAFT,
        'slug' => 'draft-tracker',
    ]);

    $response = get("/trackers/{$tracker->slug}");

    $response->assertNotFound();
});

it('returns 404 when tracker has no rank lists', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'slug' => 'empty-tracker',
    ]);

    $response = get("/trackers/{$tracker->slug}");

    $response->assertNotFound();
});

it('handles pagination on tracker index', function () {
    // Create 15 trackers (more than default pagination limit)
    Tracker::factory()->count(15)->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = get('/trackers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('trackers/index')
            ->has('trackers.data', 10) // Default pagination is 10
            ->where('trackers.current_page', 1)
            ->where('trackers.last_page', 2);
    });

    // Test second page
    $response = get('/trackers?page=2');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('trackers.data', 5) // Remaining 5 items
            ->where('trackers.current_page', 2);
    });
});

it('orders trackers by order column then by created_at desc', function () {
    $tracker1 = Tracker::factory()->create([
        'title' => 'First Tracker',
        'order' => 2,
        'status' => VisibilityStatus::PUBLISHED,
        'created_at' => now()->subDays(2),
    ]);

    $tracker2 = Tracker::factory()->create([
        'title' => 'Second Tracker',
        'order' => 1,
        'status' => VisibilityStatus::PUBLISHED,
        'created_at' => now()->subDay(),
    ]);

    $tracker3 = Tracker::factory()->create([
        'title' => 'Third Tracker',
        'order' => 1,
        'status' => VisibilityStatus::PUBLISHED,
        'created_at' => now(),
    ]);

    $response = get('/trackers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->where('trackers.data.0.title', 'Third Tracker') // order=1, newest
            ->where('trackers.data.1.title', 'Second Tracker') // order=1, older
            ->where('trackers.data.2.title', 'First Tracker'); // order=2
    });
});

it('filters events by published status in rank lists', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'slug' => 'event-filter-tracker',
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'filtered',
    ]);

    $publishedEvent = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Published Event',
    ]);

    $draftEvent = Event::factory()->create([
        'status' => VisibilityStatus::DRAFT,
        'title' => 'Draft Event',
    ]);

    // Attach both events to rank list with required weight
    $rankList->events()->attach([
        $publishedEvent->id => ['weight' => 1.0],
        $draftEvent->id => ['weight' => 1.0],
    ]);

    $response = get("/trackers/{$tracker->slug}");

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('selectedRankList.events', 1) // Only published event should appear
            ->where('selectedRankList.events.0.title', 'Published Event');
    });
});

it('can filter published trackers using published scope', function () {
    Tracker::factory()->create([
        'title' => 'Published Tracker',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    Tracker::factory()->create([
        'title' => 'Draft Tracker',
        'status' => VisibilityStatus::DRAFT,
    ]);

    $publishedTrackers = Tracker::published()->get();

    expect($publishedTrackers)->toHaveCount(1);
    expect($publishedTrackers->first()->title)->toBe('Published Tracker');
});

it('returns all trackers when search term is empty', function () {
    Tracker::factory()->count(3)->create();

    $results = Tracker::search('')->get();
    $resultsNull = Tracker::search(null)->get();

    expect($results)->toHaveCount(3);
    expect($resultsNull)->toHaveCount(3);
});

it('search scope is case insensitive', function () {
    Tracker::factory()->create([
        'title' => 'Programming Contest',
        'description' => 'ADVANCED programming challenges',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $upperCaseResults = Tracker::search('PROGRAMMING')->get();
    $lowerCaseResults = Tracker::search('programming')->get();
    $mixedCaseResults = Tracker::search('Programming')->get();

    expect($upperCaseResults)->toHaveCount(1);
    expect($lowerCaseResults)->toHaveCount(1);
    expect($mixedCaseResults)->toHaveCount(1);
});

it('casts status to VisibilityStatus enum correctly', function () {
    $tracker = Tracker::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    expect($tracker->status)->toBeInstanceOf(VisibilityStatus::class);
    expect($tracker->status)->toBe(VisibilityStatus::PUBLISHED);
});
