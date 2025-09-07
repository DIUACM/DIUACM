<?php

use App\Enums\VisibilityStatus;
use App\Models\RankList;
use App\Models\Tracker;

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

    expect($tracker->rankLists)->toHaveCount(3);
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
