<?php

use App\Enums\EventType;
use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
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

    $this->get(route('trackers.show', ['slug' => $tracker->slug, 'keyword' => $rankList->keyword]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('selected_rank_list.users.0.name', 'Active User')
            ->where('selected_rank_list.users.1.name', 'Banned User')
            ->where('selected_rank_list.users.1.is_banned', true)
        );
});
