<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

it('can process atcoder events and update user stats', function () {
    // Create a tracker
    $tracker = Tracker::factory()->create();

    // Create a rank list
    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'is_active' => true,
    ]);

    // Create an AtCoder event
    $event = Event::factory()->create([
        'title' => 'AtCoder Beginner Contest 325',
        'event_link' => 'https://atcoder.jp/contests/abc325',
        'starting_at' => now(),
    ]);

    // Associate event with rank list
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Create users with AtCoder handles
    $userWithHandle = User::factory()->create([
        'name' => 'Test User With Handle',
        'atcoder_handle' => 'test_user',
    ]);

    $userWithoutHandle = User::factory()->create([
        'name' => 'Test User Without Handle',
        'atcoder_handle' => null,
    ]);

    // Associate users with rank list
    $rankList->users()->attach([$userWithHandle->id, $userWithoutHandle->id]);

    // Mock AtCoder API responses
    Cache::shouldReceive('remember')
        ->with('atcoder_contests_json', 7200, \Closure::class)
        ->andReturn('[
            {
                "id": "abc325",
                "start_epoch_second": 1697889000,
                "duration_second": 6000
            }
        ]');

    $exitCode = Artisan::call('app:update-atcoder-event-stats');

    expect($exitCode)->toBe(0);

    // Verify that user without handle is marked as absent
    $statWithoutHandle = EventUserStat::where('event_id', $event->id)
        ->where('user_id', $userWithoutHandle->id)
        ->first();

    expect($statWithoutHandle)->not->toBeNull()
        ->and($statWithoutHandle->solve_count)->toBe(0)
        ->and($statWithoutHandle->upsolve_count)->toBe(0)
        ->and($statWithoutHandle->participation)->toBeFalse();
});

it('skips events with invalid atcoder links', function () {
    // Create a tracker
    $tracker = Tracker::factory()->create();

    // Create a rank list
    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'is_active' => true,
    ]);

    // Create event with invalid AtCoder link
    $event = Event::factory()->create([
        'title' => 'Invalid Contest',
        'event_link' => 'https://invalid-site.com/contest',
    ]);

    // Associate event with rank list
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    Cache::shouldReceive('remember')
        ->with('atcoder_contests_json', 7200, \Closure::class)
        ->andReturn('[]');

    $exitCode = Artisan::call('app:update-atcoder-event-stats');

    expect($exitCode)->toBe(0);
});

it('clears existing stats when fresh option is used', function () {
    // Create a tracker
    $tracker = Tracker::factory()->create();

    // Create a rank list
    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'is_active' => true,
    ]);

    // Create an AtCoder event
    $event = Event::factory()->create([
        'title' => 'AtCoder Test Contest',
        'event_link' => 'https://atcoder.jp/contests/test123',
    ]);

    // Associate event with rank list
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Create a user
    $user = User::factory()->create(['atcoder_handle' => null]);
    $rankList->users()->attach($user->id);

    // Create existing stat
    EventUserStat::create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'solve_count' => 5,
        'upsolve_count' => 3,
        'participation' => true,
    ]);

    Cache::shouldReceive('remember')
        ->with('atcoder_contests_json', 7200, \Closure::class)
        ->andReturn('[
            {
                "id": "test123",
                "start_epoch_second": 1697889000,
                "duration_second": 6000
            }
        ]');

    $exitCode = Artisan::call('app:update-atcoder-event-stats', ['--fresh' => true]);

    expect($exitCode)->toBe(0);

    // Verify the existing stat was replaced
    $stat = EventUserStat::where('event_id', $event->id)
        ->where('user_id', $user->id)
        ->first();

    expect($stat)->not->toBeNull()
        ->and($stat->solve_count)->toBe(0)
        ->and($stat->upsolve_count)->toBe(0)
        ->and($stat->participation)->toBeFalse();
});

it('processes only specified event when id option is provided', function () {
    // Create a tracker
    $tracker = Tracker::factory()->create();

    // Create a rank list
    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'is_active' => true,
    ]);

    // Create two AtCoder events
    $event1 = Event::factory()->create([
        'title' => 'Contest 1',
        'event_link' => 'https://atcoder.jp/contests/abc001',
    ]);

    $event2 = Event::factory()->create([
        'title' => 'Contest 2',
        'event_link' => 'https://atcoder.jp/contests/abc002',
    ]);

    // Associate both events with rank list
    $event1->rankLists()->attach($rankList->id, ['weight' => 1.0]);
    $event2->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Create a user
    $user = User::factory()->create(['atcoder_handle' => null]);
    $rankList->users()->attach($user->id);

    Cache::shouldReceive('remember')
        ->with('atcoder_contests_json', 7200, \Closure::class)
        ->andReturn('[
            {
                "id": "abc001",
                "start_epoch_second": 1697889000,
                "duration_second": 6000
            },
            {
                "id": "abc002", 
                "start_epoch_second": 1697895000,
                "duration_second": 6000
            }
        ]');

    $exitCode = Artisan::call('app:update-atcoder-event-stats', ['--id' => $event1->id]);

    expect($exitCode)->toBe(0);

    // Verify only event1 has stats
    expect(EventUserStat::where('event_id', $event1->id)->count())->toBe(1);
    expect(EventUserStat::where('event_id', $event2->id)->count())->toBe(0);
});
