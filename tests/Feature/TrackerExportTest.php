<?php

use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\get;

uses(RefreshDatabase::class);

it('can export ranklist as json', function () {
    $tracker = Tracker::factory()->create([
        'status' => \App\Enums\VisibilityStatus::PUBLISHED,
        'slug' => 'test-tracker',
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'test-ranklist',
    ]);

    $users = User::factory(3)->create();
    $events = Event::factory(2)->create([
        'status' => \App\Enums\VisibilityStatus::PUBLISHED,
    ]);

    // Attach users to ranklist with scores
    $rankList->users()->attach([
        $users[0]->id => ['score' => 100.5],
        $users[1]->id => ['score' => 85.0],
        $users[2]->id => ['score' => 70.5],
    ]);

    // Attach events to ranklist
    $rankList->events()->attach($events->mapWithKeys(function ($event) {
        return [$event->id => ['weight' => 1.0]];
    }));

    $response = get(route('trackers.export', $tracker->slug).'?keyword=test-ranklist&format=json');

    $response->assertOk();

    $data = $response->json();

    expect($data)->toHaveCount(3);
    expect($data[0])->toHaveKeys(['rank', 'name', 'email', 'username', 'codeforces_handle', 'vjudge_handle', 'atcoder_handle', 'score']);
    expect($data[0]['rank'])->toBe(1);
    expect($data[0]['score'])->toBe(100.5);
});

it('can export ranklist as csv', function () {
    $tracker = Tracker::factory()->create([
        'status' => \App\Enums\VisibilityStatus::PUBLISHED,
        'slug' => 'test-tracker-csv',
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'test-ranklist-csv',
    ]);

    $user = User::factory()->create([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'username' => 'johndoe',
        'codeforces_handle' => 'john_cf',
        'vjudge_handle' => 'john_vj',
        'atcoder_handle' => 'john_at',
    ]);

    // Attach user to ranklist with score
    $rankList->users()->attach($user->id, ['score' => 95.5]);

    $response = get(route('trackers.export', $tracker->slug).'?keyword=test-ranklist-csv&format=csv');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

    $content = $response->getContent();
    $lines = explode("\n", trim($content));

    expect($lines[0])->toContain('rank,name,email,username,codeforces_handle,vjudge_handle,atcoder_handle,score');
    expect($lines[1])->toContain('1,"John Doe",john@example.com,johndoe,john_cf,john_vj,john_at,95.5');
});

it('returns 404 for unpublished tracker', function () {
    $tracker = Tracker::factory()->create([
        'status' => \App\Enums\VisibilityStatus::DRAFT,
        'slug' => 'draft-tracker',
    ]);

    $response = get(route('trackers.export', $tracker->slug).'?format=json');

    $response->assertNotFound();
});

it('returns 400 for invalid format', function () {
    $tracker = Tracker::factory()->create([
        'status' => \App\Enums\VisibilityStatus::PUBLISHED,
        'slug' => 'valid-tracker',
    ]);

    $response = get(route('trackers.export', $tracker->slug).'?format=invalid');

    $response->assertStatus(400);
});
