<?php

use App\Enums\VisibilityStatus;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tracker can be created', function () {
    $tracker = Tracker::factory()->create([
        'title' => 'Test Tracker',
        'slug' => 'test-tracker',
        'status' => VisibilityStatus::PUBLIC,
    ]);

    expect($tracker->title)->toBe('Test Tracker');
    expect($tracker->slug)->toBe('test-tracker');
    expect($tracker->status)->toBe(VisibilityStatus::PUBLIC);
});

test('tracker has many rank lists', function () {
    $tracker = Tracker::factory()->create();

    RankList::factory()->count(3)->create([
        'tracker_id' => $tracker->id,
    ]);

    expect($tracker->fresh()->rankLists)->toHaveCount(3);
});

test('rank list belongs to tracker', function () {
    $tracker = Tracker::factory()->create(['title' => 'Contest Tracker']);
    $rankList = RankList::factory()->create(['tracker_id' => $tracker->id]);

    expect($rankList->tracker->title)->toBe('Contest Tracker');
});

test('rank list keyword-tracker combination is unique', function () {
    $tracker = Tracker::factory()->create();

    RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'codeforces',
    ]);

    // This should throw an exception due to unique constraint
    expect(fn () => RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'codeforces',
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('rank list can have different keywords for different trackers', function () {
    $tracker1 = Tracker::factory()->create();
    $tracker2 = Tracker::factory()->create();

    $rankList1 = RankList::factory()->create([
        'tracker_id' => $tracker1->id,
        'keyword' => 'codeforces',
    ]);

    $rankList2 = RankList::factory()->create([
        'tracker_id' => $tracker2->id,
        'keyword' => 'codeforces', // Same keyword but different tracker - should work
    ]);

    expect($rankList1->keyword)->toBe('codeforces');
    expect($rankList2->keyword)->toBe('codeforces');
    expect($rankList1->tracker_id)->not->toBe($rankList2->tracker_id);
});
