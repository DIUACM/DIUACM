<?php

use App\Enums\VisibilityStatus;
use App\Models\RankList;
use App\Models\Tracker;
use Inertia\Testing\AssertableInertia as Assert;

it('renders trackers index with published trackers', function () {
    $t1 = Tracker::factory()->create(['status' => VisibilityStatus::PUBLISHED, 'title' => 'Alpha']);
    $t2 = Tracker::factory()->create(['status' => VisibilityStatus::PUBLISHED, 'title' => 'Beta']);
    // add ranklists to affect count
    RankList::factory()->count(2)->create(['tracker_id' => $t1->id, 'status' => VisibilityStatus::PUBLISHED]);
    RankList::factory()->count(1)->create(['tracker_id' => $t2->id, 'status' => VisibilityStatus::PUBLISHED]);

    $response = test()->get('/trackers');
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('trackers/index')
        ->has('trackers', 2)
    );
});

it('hides draft trackers on index', function () {
    Tracker::factory()->create(['status' => VisibilityStatus::DRAFT]);

    $response = test()->get('/trackers');
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('trackers/index')
        ->has('trackers', 0)
    );
});
