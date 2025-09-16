<?php

use App\Models\Contest;
use App\Models\RankList;
use App\Models\Team;
use App\Models\Tracker;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('renders programmer show page', function () {
    $user = User::factory()->create([
        'name' => 'John Doe',
        'username' => 'johndoe',
        'email' => 'john@example.com',
        'max_cf_rating' => 1500,
        'codeforces_handle' => 'johndoe_cf',
        'student_id' => '123456789',
        'department' => 'Computer Science',
    ]);

    $response = test()->get("/programmers/{$user->username}");

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Programmers/Show')
        ->has('programmer')
        ->where('programmer.name', 'John Doe')
        ->where('programmer.username', 'johndoe')
        ->where('programmer.max_cf_rating', 1500)
        ->where('programmer.codeforces_handle', 'johndoe_cf')
        ->where('programmer.student_id', '123456789')
        ->where('programmer.department', 'Computer Science')
        ->has('contest_participations')
        ->has('tracker_performances')
    );
});

it('shows contest participations with team details', function () {
    $user = User::factory()->create([
        'username' => 'johndoe',
        'email' => 'john@example.com',
    ]);

    $contest = Contest::factory()->create([
        'name' => 'Programming Contest 2024',
        'date' => '2024-01-15 10:00:00',
    ]);

    $team = Team::factory()->create([
        'name' => 'Team Alpha',
        'rank' => 5,
        'solve_count' => 8,
    ]);

    $team->contest()->associate($contest);
    $team->save();

    $team->members()->attach($user);

    $response = test()->get("/programmers/{$user->username}");

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Programmers/Show')
        ->has('contest_participations', 1)
        ->where('contest_participations.0.contest.name', 'Programming Contest 2024')
        ->where('contest_participations.0.team.name', 'Team Alpha')
        ->where('contest_participations.0.team.rank', 5)
        ->where('contest_participations.0.team.solve_count', 8)
        ->has('contest_participations.0.team.members', 1)
    );
});

it('shows tracker performances with rank lists', function () {
    $user = User::factory()->create([
        'username' => 'johndoe',
        'email' => 'john@example.com',
    ]);

    $tracker = Tracker::factory()->create([
        'title' => 'Weekly Practice',
        'slug' => 'weekly-practice',
    ]);

    $rankList = RankList::factory()->create([
        'keyword' => 'week-1',
    ]);

    $rankList->tracker()->associate($tracker);
    $rankList->save();

    $user->rankLists()->attach($rankList, ['score' => 85.5]);

    $response = test()->get("/programmers/{$user->username}");

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Programmers/Show')
        ->has('tracker_performances', 1)
        ->where('tracker_performances.0.tracker.title', 'Weekly Practice')
        ->where('tracker_performances.0.tracker.slug', 'weekly-practice')
        ->has('tracker_performances.0.rank_lists', 1)
        ->where('tracker_performances.0.rank_lists.0.rank_list.keyword', 'week-1')
        ->where('tracker_performances.0.rank_lists.0.score', 85.5)
    );
});

it('returns 404 for non-existent username', function () {
    test()->get('/programmers/nonexistent')
        ->assertNotFound();
});

it('handles user with minimal information', function () {
    $user = User::factory()->create([
        'name' => 'Jane Doe',
        'username' => 'janedoe',
        'email' => 'jane@example.com',
        'max_cf_rating' => -1, // Unrated
        'codeforces_handle' => null,
        'student_id' => null,
        'department' => null,
    ]);

    $response = test()->get("/programmers/{$user->username}");

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Programmers/Show')
        ->where('programmer.name', 'Jane Doe')
        ->where('programmer.username', 'janedoe')
        ->where('programmer.max_cf_rating', -1)
        ->where('programmer.codeforces_handle', null)
        ->where('programmer.student_id', null)
        ->where('programmer.department', null)
        ->has('contest_participations', 0)
        ->has('tracker_performances', 0)
    );
});

it('shows multiple platform handles', function () {
    $user = User::factory()->create([
        'username' => 'johndoe',
        'email' => 'john@example.com',
        'codeforces_handle' => 'john_cf',
        'atcoder_handle' => 'john_ac',
        'vjudge_handle' => 'john_vj',
    ]);

    $response = test()->get("/programmers/{$user->username}");

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Programmers/Show')
        ->where('programmer.codeforces_handle', 'john_cf')
        ->where('programmer.atcoder_handle', 'john_ac')
        ->where('programmer.vjudge_handle', 'john_vj')
    );
});

it('transforms programmer image to s3 url in show page', function () {
    $user = User::factory()->create([
        'name' => 'John Doe',
        'username' => 'johndoe',
        'email' => 'john@example.com',
        'image' => 'profile-images/john-avatar.jpg',
    ]);

    test()->get("/programmers/{$user->username}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Programmers/Show')
            ->where('programmer.image', Storage::disk('s3')->url('profile-images/john-avatar.jpg'))
        );
});

it('handles null programmer image in show page', function () {
    $user = User::factory()->create([
        'name' => 'Jane Doe',
        'username' => 'janedoe',
        'email' => 'jane@example.com',
        'image' => null,
    ]);

    test()->get("/programmers/{$user->username}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Programmers/Show')
            ->where('programmer.image', null)
        );
});

it('transforms team member images to s3 urls', function () {
    $user1 = User::factory()->create([
        'username' => 'johndoe',
        'email' => 'john@example.com',
        'image' => 'profile-images/john.jpg',
    ]);

    $user2 = User::factory()->create([
        'username' => 'janedoe',
        'email' => 'jane@example.com',
        'image' => 'profile-images/jane.jpg',
    ]);

    $contest = Contest::factory()->create();
    $team = Team::factory()->create();
    $team->contest()->associate($contest);
    $team->save();

    $team->members()->attach([$user1->id, $user2->id]);

    test()->get("/programmers/{$user1->username}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Programmers/Show')
            ->has('contest_participations', 1)
            ->has('contest_participations.0.team.members', 2)
            ->where('contest_participations.0.team.members.0.user.image', Storage::disk('s3')->url('profile-images/john.jpg'))
            ->where('contest_participations.0.team.members.1.user.image', Storage::disk('s3')->url('profile-images/jane.jpg'))
        );
});
