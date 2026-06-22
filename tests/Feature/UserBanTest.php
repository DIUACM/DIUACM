<?php

use App\Enums\EventType;
use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\RankList;
use App\Models\Team;
use App\Models\Tracker;
use App\Models\User;
use App\Services\RankListScoreService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

it('prevents banned users from logging in with credentials', function () {
    $user = User::factory()->banned()->create([
        'email' => 'banned@example.com',
        'password' => Hash::make('password'),
    ]);

    $this->post(route('login.store'), [
        'login' => $user->email,
        'password' => 'password',
    ])
        ->assertRedirect()
        ->assertSessionHasErrors('login');

    $this->assertGuest();
});

it('logs out a banned user on their next request', function () {
    $user = User::factory()->create();

    $this->actingAs($user);
    $user->forceFill(['is_banned' => true])->save();

    $this->get(route('home'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['login' => 'Your account has been banned.']);

    $this->assertGuest();
});

it('revokes database sessions when a user is banned', function () {
    $user = User::factory()->create(['remember_token' => 'remember-me']);

    DB::table('sessions')->insert([
        'id' => 'active-session',
        'user_id' => $user->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest',
        'payload' => 'session-payload',
        'last_activity' => now()->timestamp,
    ]);

    $user->update(['is_banned' => true]);

    $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
    expect($user->fresh()->remember_token)->toBeNull();
});

it('sets every existing ranklist score and position to banned sentinel values', function () {
    $user = User::factory()->create();
    $rankLists = RankList::factory()->count(2)->create();

    foreach ($rankLists as $rankList) {
        $rankList->users()->attach($user, ['score' => 500, 'position' => 1]);
    }

    $user->update(['is_banned' => true]);

    foreach ($rankLists as $rankList) {
        $this->assertDatabaseHas('rank_list_user', [
            'rank_list_id' => $rankList->id,
            'user_id' => $user->id,
            'score' => User::BANNED_RANKLIST_SCORE,
            'position' => User::BANNED_RANKLIST_POSITION,
        ]);
    }
});

it('excludes banned users from programmer search', function () {
    User::factory()->withHandles()->create(['name' => 'Visible Programmer']);
    User::factory()->withHandles()->banned()->create(['name' => 'Banned Programmer']);

    $this->get(route('programmers.index', ['search' => 'Programmer']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('programmers.data', 1)
            ->where('programmers.data.0.name', 'Visible Programmer')
        );
});

it('places banned users last in event attendance and performance', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'type' => EventType::CONTEST,
        'open_for_attendance' => true,
    ]);
    $activeUser = User::factory()->create(['name' => 'Active User']);
    $bannedUser = User::factory()->banned()->create(['name' => 'Banned User']);

    $event->attendees()->attach($activeUser, ['created_at' => now()->subHour(), 'updated_at' => now()->subHour()]);
    $event->attendees()->attach($bannedUser, ['created_at' => now(), 'updated_at' => now()]);
    $event->usersWithStats()->attach($activeUser, ['solve_count' => 1, 'upsolve_count' => 0, 'participation' => true]);
    $event->usersWithStats()->attach($bannedUser, ['solve_count' => 100, 'upsolve_count' => 100, 'participation' => true]);

    $this->get(route('events.show', $event))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('event.attendance.0.name', 'Active User')
            ->where('event.attendance.1.name', 'Banned User')
            ->where('event.attendance.1.is_banned', true)
            ->where('event.performance.0.name', 'Active User')
            ->where('event.performance.1.name', 'Banned User')
            ->where('event.performance.1.is_banned', true)
        );
});

it('places banned users last in tracker ranklists', function () {
    Cache::flush();

    $tracker = Tracker::factory()->published()->create();
    $rankList = RankList::factory()->published()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'main-ranklist',
    ]);
    $activeUser = User::factory()->create(['name' => 'Active User']);
    $bannedUser = User::factory()->banned()->create(['name' => 'Banned User']);

    $rankList->users()->attach($bannedUser, ['position' => 1, 'score' => 100]);
    $rankList->users()->attach($activeUser, ['position' => 2, 'score' => 50]);

    $this->assertDatabaseHas('rank_list_user', [
        'rank_list_id' => $rankList->id,
        'user_id' => $bannedUser->id,
        'score' => User::BANNED_RANKLIST_SCORE,
        'position' => User::BANNED_RANKLIST_POSITION,
    ]);

    $this->get(route('trackers.show', ['slug' => $tracker->slug, 'keyword' => $rankList->keyword]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('selected_rank_list.users.0.name', 'Active User')
            ->where('selected_rank_list.users.1.name', 'Banned User')
            ->where('selected_rank_list.users.1.is_banned', true)
        );
});

it('keeps banned sentinel values during ranklist recalculation', function () {
    $rankList = RankList::factory()->create(['consider_strict_attendance' => false]);
    $event = Event::factory()->create();
    $activeUser = User::factory()->create();
    $bannedUser = User::factory()->banned()->create();

    $rankList->events()->attach($event, ['weight' => 1]);
    $rankList->users()->attach($activeUser, ['score' => 0, 'position' => 2]);
    $rankList->users()->attach($bannedUser);
    $event->usersWithStats()->attach($activeUser, ['solve_count' => 2, 'upsolve_count' => 0, 'participation' => true]);
    $event->usersWithStats()->attach($bannedUser, ['solve_count' => 100, 'upsolve_count' => 100, 'participation' => true]);

    DB::table('rank_list_user')
        ->where('rank_list_id', $rankList->id)
        ->where('user_id', $bannedUser->id)
        ->update(['score' => 1000, 'position' => 1]);

    app(RankListScoreService::class)->recalculateScoresForRankList($rankList);

    $this->assertDatabaseHas('rank_list_user', [
        'rank_list_id' => $rankList->id,
        'user_id' => $activeUser->id,
        'score' => 2,
        'position' => 1,
    ]);
    $this->assertDatabaseHas('rank_list_user', [
        'rank_list_id' => $rankList->id,
        'user_id' => $bannedUser->id,
        'score' => User::BANNED_RANKLIST_SCORE,
        'position' => User::BANNED_RANKLIST_POSITION,
    ]);
});

it('marks banned programmer profiles and places banned contest team members last', function () {
    $activeUser = User::factory()->create(['name' => 'Active Member']);
    $bannedUser = User::factory()->banned()->create(['name' => 'Banned Member']);
    $team = Team::factory()->create();

    $team->members()->attach([$bannedUser->id, $activeUser->id]);

    $this->get(route('programmers.show', $bannedUser))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('programmer.name', 'Banned Member')
            ->where('programmer.is_banned', true)
        );

    $this->get(route('contests.show', $team->contest))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('contest.teams.0.members.0.name', 'Active Member')
            ->where('contest.teams.0.members.1.name', 'Banned Member')
            ->where('contest.teams.0.members.1.is_banned', true)
        );

    $this->get(route('programmers.show', $activeUser))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('programmer.contests.0.team.members.0.name', 'Active Member')
            ->where('programmer.contests.0.team.members.1.name', 'Banned Member')
            ->where('programmer.contests.0.team.members.1.is_banned', true)
        );
});
