<?php

use App\Models\Event;
use App\Models\RankList;
use App\Models\User;

test('vjudge controller allows data processing when auto_update_score is true', function () {
    // Create a user with a vjudge handle
    $user = User::factory()->create([
        'vjudge_handle' => 'test_user',
    ]);

    // Create a rank list for the user
    $rankList = RankList::factory()->create([
        'is_active' => true,
    ]);
    $rankList->users()->attach($user->id);

    // Create an event with auto_update_score enabled (default)
    $event = Event::factory()->create([
        'event_link' => 'https://vjudge.net/contest/123456',
        'auto_update_score' => true,
    ]);
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Mock VJudge data
    $vjudgeData = [
        'length' => 7200000, // 2 hours in milliseconds
        'participants' => [
            1 => ['test_user', 'User 1'],
        ],
        'submissions' => [
            [1, 0, 1, 3600], // participant 1, problem 0, accepted, 1 hour
        ],
    ];

    // Send authenticated request to process contest data
    $response = $this->actingAs($user)
        ->postJson("/api/events/{$event->id}/vjudge-update", $vjudgeData);

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'VJudge data processed and database updated successfully',
        ]);
});

test('vjudge controller blocks data processing when auto_update_score is false', function () {
    // Create a user with a vjudge handle
    $user = User::factory()->create([
        'vjudge_handle' => 'test_user',
    ]);

    // Create a rank list for the user
    $rankList = RankList::factory()->create([
        'is_active' => true,
    ]);
    $rankList->users()->attach($user->id);

    // Create an event with auto_update_score disabled
    $event = Event::factory()->create([
        'event_link' => 'https://vjudge.net/contest/123456',
        'auto_update_score' => false,
    ]);
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Mock VJudge data
    $vjudgeData = [
        'length' => 7200000, // 2 hours in milliseconds
        'participants' => [
            1 => ['test_user', 'User 1'],
        ],
        'submissions' => [
            [1, 0, 1, 3600], // participant 1, problem 0, accepted, 1 hour
        ],
    ];

    // Send authenticated request to process contest data
    $response = $this->actingAs($user)
        ->postJson("/api/events/{$event->id}/vjudge-update", $vjudgeData);

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Auto update score is disabled for this event',
        ]);
});

test('auto_update_score defaults to true for new events', function () {
    $event = Event::factory()->create();

    expect($event->auto_update_score)->toBeTrue();
});
