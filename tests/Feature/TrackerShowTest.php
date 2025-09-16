<?php

use App\Enums\VisibilityStatus;
use App\Models\RankList;
use App\Models\Tracker;
use Inertia\Testing\AssertableInertia as Assert;

test('can display tracker show page', function () {
    $tracker = Tracker::factory()->create([
        'title' => 'Test Tracker',
        'slug' => 'test-tracker',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'test-keyword',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = test()->get("/trackers/{$tracker->slug}/{$rankList->keyword}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('trackers/show')
        ->has('tracker')
        ->where('tracker.title', 'Test Tracker')
        ->where('tracker.slug', 'test-tracker')
    );
});

test('can display tracker show page without keyword', function () {
    $tracker = Tracker::factory()->create([
        'title' => 'Test Tracker',
        'slug' => 'test-tracker',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'default-keyword',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = test()->get("/trackers/{$tracker->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('trackers/show')
        ->has('tracker')
        ->has('selectedRankList')
        ->where('selectedRankList.keyword', 'default-keyword')
    );
});

test('returns 404 for non-existent tracker', function () {
    $response = test()->get('/trackers/non-existent-tracker');

    $response->assertNotFound();
});
