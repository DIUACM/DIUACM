<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Spatie\Permission\Models\Permission;

it('requires authentication', function () {
    $this->getJson(route('api.migration.export'))
        ->assertUnauthorized();
});

it('requires permission to export migration data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('api.migration.export'))
        ->assertForbidden();
});

it('exports users events trackers rank lists and relationship tables without pagination', function () {
    Permission::create(['name' => 'ViewAny:User']);

    $admin = User::factory()->create();
    $admin->givePermissionTo('ViewAny:User');

    $trackedUser = User::factory()->create([
        'email' => 'tracked@example.com',
        'username' => 'tracked-user',
    ]);
    $event = Event::factory()->create(['title' => 'Migration Contest']);
    $tracker = Tracker::factory()->create(['slug' => 'migration-tracker']);
    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'migration-ranklist',
    ]);

    $event->attendees()->attach($trackedUser->id);
    $rankList->events()->attach($event->id, ['weight' => 2.5]);
    $rankList->users()->attach($trackedUser->id, [
        'score' => 42.75,
        'position' => 1,
    ]);
    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $trackedUser->id,
        'solve_count' => 4,
        'upsolve_count' => 2,
        'participation' => true,
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('api.migration.export'))
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'users',
                'events',
                'trackers',
                'rank_lists',
                'event_attendance',
                'event_rank_list',
                'event_user_stats',
                'rank_list_user',
            ],
        ]);

    $payload = $response->json('data');

    expect($payload)->not->toHaveKeys(['links', 'meta'])
        ->and(collect($payload['users'])->pluck('email'))->toContain('tracked@example.com')
        ->and(collect($payload['events'])->pluck('title'))->toContain('Migration Contest')
        ->and(collect($payload['trackers'])->pluck('slug'))->toContain('migration-tracker')
        ->and(collect($payload['rank_lists'])->pluck('keyword'))->toContain('migration-ranklist')
        ->and($payload['event_rank_list'])->toContain([
            'event_id' => $event->id,
            'rank_list_id' => $rankList->id,
            'weight' => 2.5,
        ])
        ->and($payload['rank_list_user'])->toContain([
            'rank_list_id' => $rankList->id,
            'user_id' => $trackedUser->id,
            'score' => 42.75,
            'position' => 1,
        ])
        ->and(collect($payload['event_user_stats'])->pluck('solve_count'))->toContain(4);
});
