<?php

use App\Models\Event;
use App\Models\EventUserStat;
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

test('vjudge controller includes users whose vjudge_handle matches vjudge usernames in payload', function () {
    // Create a user with vjudge_handle matching VJudge data (not in ranklist)
    $userWithMatchingHandle = User::factory()->create([
        'username' => 'different_username',
        'vjudge_handle' => 'matching_handle',
    ]);

    // Create a user with vjudge_handle in ranklist
    $userInRankList = User::factory()->create([
        'vjudge_handle' => 'ranklist_user',
        'username' => 'ranklist_username',
    ]);

    // Create a rank list for the second user only
    $rankList = RankList::factory()->create([
        'is_active' => true,
    ]);
    $rankList->users()->attach($userInRankList->id);

    // Create an event with auto_update_score enabled
    $event = Event::factory()->create([
        'event_link' => 'https://vjudge.net/contest/123456',
        'auto_update_score' => true,
    ]);
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Mock VJudge data with both vjudge handles
    $vjudgeData = [
        'length' => 7200000, // 2 hours in milliseconds
        'participants' => [
            1 => ['matching_handle', 'User 1'],
            2 => ['ranklist_user', 'User 2'],
        ],
        'submissions' => [
            [1, 0, 1, 3600], // participant 1, problem 0, accepted, 1 hour
            [2, 1, 1, 3600], // participant 2, problem 1, accepted, 1 hour
        ],
    ];

    // Send authenticated request to process contest data
    $response = $this->actingAs($userInRankList)
        ->postJson("/api/events/{$event->id}/vjudge-update", $vjudgeData);

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'VJudge data processed and database updated successfully',
        ]);

    // Verify both users got their stats updated
    expect(EventUserStat::where('user_id', $userWithMatchingHandle->id)
        ->where('event_id', $event->id)
        ->where('solves_count', 1)
        ->where('participation', true)
        ->exists())->toBeTrue();

    expect(EventUserStat::where('user_id', $userInRankList->id)
        ->where('event_id', $event->id)
        ->where('solves_count', 1)
        ->where('participation', true)
        ->exists())->toBeTrue();
});

test('vjudge controller does not match users by username only', function () {
    // Create a user without vjudge_handle but with username matching VJudge data
    $userWithMatchingUsername = User::factory()->create([
        'username' => 'matching_username',
        'vjudge_handle' => null,
    ]);

    // Create a user with vjudge_handle in ranklist
    $userInRankList = User::factory()->create([
        'vjudge_handle' => 'ranklist_user',
        'username' => 'ranklist_username',
    ]);

    // Create a rank list for the second user only
    $rankList = RankList::factory()->create([
        'is_active' => true,
    ]);
    $rankList->users()->attach($userInRankList->id);

    // Create an event with auto_update_score enabled
    $event = Event::factory()->create([
        'event_link' => 'https://vjudge.net/contest/123456',
        'auto_update_score' => true,
    ]);
    $event->rankLists()->attach($rankList->id, ['weight' => 1.0]);

    // Mock VJudge data with username that matches a user but not their vjudge_handle
    $vjudgeData = [
        'length' => 7200000, // 2 hours in milliseconds
        'participants' => [
            1 => ['matching_username', 'User 1'],
            2 => ['ranklist_user', 'User 2'],
        ],
        'submissions' => [
            [1, 0, 1, 3600], // participant 1, problem 0, accepted, 1 hour
            [2, 1, 1, 3600], // participant 2, problem 1, accepted, 1 hour
        ],
    ];

    // Send authenticated request to process contest data
    $response = $this->actingAs($userInRankList)
        ->postJson("/api/events/{$event->id}/vjudge-update", $vjudgeData);

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'VJudge data processed and database updated successfully',
        ]);

    // Verify that the user with matching username but no vjudge_handle was NOT included
    expect(EventUserStat::where('user_id', $userWithMatchingUsername->id)
        ->where('event_id', $event->id)
        ->exists())->toBeFalse();

    // Verify that the user in ranklist got their stats updated
    expect(EventUserStat::where('user_id', $userInRankList->id)
        ->where('event_id', $event->id)
        ->where('solves_count', 1)
        ->where('participation', true)
        ->exists())->toBeTrue();
});
