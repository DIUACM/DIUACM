<?php

use App\Enums\EventType;
use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;

it('processes current object and legacy indexed VJudge participants', function () {
    $authorizedUser = User::factory()->create([
        'email' => 'sourov2305101004@diu.edu.bd',
        'vjudge_handle' => null,
    ]);
    $currentPayloadUser = User::factory()->create(['vjudge_handle' => 'current-user']);
    $legacyPayloadUser = User::factory()->create(['vjudge_handle' => 'legacy-user']);
    $event = Event::factory()->create([
        'type' => EventType::CONTEST,
        'consider_partial_accept' => true,
    ]);

    $payload = [
        'length' => 14_400_000,
        'participants' => [
            '729105' => [
                'image' => 'https://example.com/avatar.png',
                'members' => [],
                'name' => 'current-user',
                'type' => 'user',
            ],
            '886960' => ['legacy-user'],
        ],
        'submissions' => [
            ['729105', 0, 1, 100],
            ['886960', 75, 1, 15_000],
        ],
    ];

    $this->actingAs($authorizedUser)
        ->postJson("/api/events/{$event->id}/vjudge-update", $payload)
        ->assertSuccessful()
        ->assertJson([
            'message' => 'VJudge data processed and database updated successfully',
            'processed_users' => 2,
        ]);

    $this->assertDatabaseHas('event_user_stats', [
        'event_id' => $event->id,
        'user_id' => $currentPayloadUser->id,
        'solve_count' => 1,
        'upsolve_count' => 0,
        'participation' => true,
    ]);
    $this->assertDatabaseHas('event_user_stats', [
        'event_id' => $event->id,
        'user_id' => $legacyPayloadUser->id,
        'solve_count' => 0,
        'upsolve_count' => 1,
        'participation' => false,
    ]);
});

it('rejects payloads without valid participants without deleting existing statistics', function () {
    $authorizedUser = User::factory()->create([
        'email' => 'sourov2305101004@diu.edu.bd',
        'vjudge_handle' => null,
    ]);
    $participant = User::factory()->create(['vjudge_handle' => 'existing-user']);
    $event = Event::factory()->create(['type' => EventType::CONTEST]);
    $existingStat = EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $participant->id,
        'solve_count' => 5,
    ]);

    $this->actingAs($authorizedUser)
        ->postJson("/api/events/{$event->id}/vjudge-update", [
            'length' => 14_400_000,
            'participants' => [
                '729105' => ['members' => [], 'type' => 'user'],
            ],
            'submissions' => [],
        ])
        ->assertUnprocessable()
        ->assertJson([
            'message' => 'No valid VJudge participants found in payload',
        ]);

    $this->assertDatabaseHas('event_user_stats', [
        'id' => $existingStat->id,
        'solve_count' => 5,
    ]);
});
