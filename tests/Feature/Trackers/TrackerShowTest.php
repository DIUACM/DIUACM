<?php

use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders tracker show page with current ranklist', function () {
    /** @var Tracker $tracker */
    $tracker = Tracker::factory()->create(['status' => VisibilityStatus::PUBLISHED]);

    /** @var RankList $rank */
    $rank = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'status' => VisibilityStatus::PUBLISHED,
        'is_active' => true,
        'keyword' => 'main',
    ]);

    $events = Event::factory()->count(2)->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'strict_attendance' => false,
    ]);

    $rank->events()->attach($events[0]->id, ['weight' => 1]);
    $rank->events()->attach($events[1]->id, ['weight' => 2]);

    $users = User::factory()->count(2)->create();
    foreach ($users as $u) {
        $rank->users()->attach($u->id, ['score' => 0]);
    }

    $response = test()->get("/trackers/{$tracker->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('trackers/show')
        ->has('tracker', fn (Assert $t) => $t
            ->where('id', $tracker->id)
            ->where('slug', (string) $tracker->slug)
            ->etc()
        )
        ->has('current_ranklist', fn (Assert $r) => $r
            ->where('id', $rank->id)
            ->has('events')
            ->has('users')
            ->etc()
        )
    );
});

it('shows ranklist-not-found payload when keyword missing', function () {
    /** @var Tracker $tracker */
    $tracker = Tracker::factory()->create(['status' => VisibilityStatus::PUBLISHED]);

    // Publish one ranklist with keyword 'alpha'
    $rank = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'status' => VisibilityStatus::PUBLISHED,
        'is_active' => true,
        'keyword' => 'alpha',
    ]);

    $response = test()->get("/trackers/{$tracker->slug}/beta");
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('trackers/show')
        ->has('not_found', fn (Assert $nf) => $nf
            ->where('type', 'ranklist_not_found')
            ->where('requested_keyword', 'beta')
            ->has('available_ranklists')
        )
    );
});
