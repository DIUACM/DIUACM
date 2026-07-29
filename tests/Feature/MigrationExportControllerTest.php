<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Illuminate\Http\UploadedFile;

it('fails closed when the migration export api key is not configured', function () {
    config(['services.migration_export.api_key' => null]);

    $this->getJson(route('api.migration.export'))
        ->assertServiceUnavailable()
        ->assertJson([
            'message' => 'Migration export API key is not configured.',
        ]);
});

it('requires the migration export api key', function () {
    config(['services.migration_export.api_key' => 'test-export-key']);

    $this->getJson(route('api.migration.export'))
        ->assertUnauthorized();

    $this->getJson(route('api.migration.export.structure'))
        ->assertUnauthorized();
});

it('rejects an invalid migration export api key', function () {
    config(['services.migration_export.api_key' => 'test-export-key']);

    $this->getJson(route('api.migration.export'), [
        'X-Migration-Export-Key' => 'wrong-key',
    ])
        ->assertForbidden();

    $this->getJson(route('api.migration.export.structure', ['api_key' => 'wrong-key']))
        ->assertForbidden();
});

it('exports users events trackers rank lists and relationship tables without pagination', function () {
    config(['services.migration_export.api_key' => 'test-export-key']);

    $trackedUser = User::factory()->create([
        'email' => 'tracked@example.com',
        'username' => 'tracked-user',
    ]);
    $trackedUser->addMedia(UploadedFile::fake()->image('profile-picture.jpg'))
        ->toMediaCollection('profile_picture');
    $originalImageUrl = $trackedUser->getFirstMediaUrl('profile_picture');
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

    $response = $this
        ->getJson(route('api.migration.export'), [
            'X-Migration-Export-Key' => 'test-export-key',
        ])
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
    $exportedUser = collect($payload['users'])->firstWhere('id', $trackedUser->id);

    expect($payload)->not->toHaveKeys(['links', 'meta'])
        ->and(collect($payload['users'])->pluck('email'))->toContain('tracked@example.com')
        ->and($exportedUser['image'])->toBe($originalImageUrl)
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

it('returns the export api structure and generated examples', function () {
    config(['services.migration_export.api_key' => 'test-export-key']);

    $response = $this
        ->getJson(route('api.migration.export.structure', ['api_key' => 'test-export-key']))
        ->assertOk()
        ->assertJsonPath('data.endpoint.method', 'GET')
        ->assertJsonPath('data.endpoint.path', '/api/migration/export')
        ->assertJsonPath('data.endpoint.authentication', 'API key required')
        ->assertJsonPath('data.endpoint.api_key.env', 'MIGRATION_EXPORT_API_KEY')
        ->assertJsonPath('data.endpoint.api_key.header', 'X-Migration-Export-Key')
        ->assertJsonPath('data.endpoint.api_key.query_parameter', 'api_key')
        ->assertJsonPath('data.response.pagination', false)
        ->assertJsonPath('data.response.root_key', 'data')
        ->assertJsonStructure([
            'data' => [
                'endpoint' => [
                    'method',
                    'path',
                    'route_name',
                    'authentication',
                    'api_key' => [
                        'env',
                        'header',
                        'query_parameter',
                    ],
                ],
                'response' => [
                    'content_type',
                    'pagination',
                    'root_key',
                    'tables',
                    'structure' => [
                        'users' => [
                            '*' => [
                                'name',
                                'type',
                                'nullable',
                                'default',
                            ],
                        ],
                        'events',
                        'trackers',
                        'rank_lists',
                        'event_attendance',
                        'event_rank_list',
                        'event_user_stats',
                        'rank_list_user',
                    ],
                ],
                'example' => [
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
                ],
            ],
        ]);

    $payload = $response->json('data');
    $userColumns = collect($payload['response']['structure']['users'])->pluck('name');

    expect($payload['response']['tables'])->toBe([
        'users',
        'events',
        'trackers',
        'rank_lists',
        'event_attendance',
        'event_rank_list',
        'event_user_stats',
        'rank_list_user',
    ])
        ->and($userColumns)->toContain('id', 'email', 'username', 'image')
        ->and($payload['example']['data']['users'][0])->toHaveKeys(['id', 'email', 'username', 'image'])
        ->and($payload['example']['data']['users'][0]['image'])->toBe('https://example.com/profile-picture.jpg')
        ->and($payload['example']['data']['event_rank_list'][0])->toHaveKeys(['event_id', 'rank_list_id', 'weight']);
});
