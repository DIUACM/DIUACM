<?php

use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;

uses()->group('events');

it('can show published event details', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Test Event',
        'description' => 'Test event description',
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/show')
            ->has('event', fn ($event) => $event
                ->where('title', 'Test Event')
                ->where('description', 'Test event description')
                ->etc()
            )
        );
});

it('cannot show unpublished event', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertNotFound();
});

it('shows attendees list correctly', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $users = User::factory()->count(3)->create();

    foreach ($users as $user) {
        $event->attendees()->attach($user);
    }

    $response = $this->get(route('events.show', $event));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('event.attendees', 3)
            ->where('event.attendees_count', 3)
        );
});

it('requires authentication to mark attendance', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
    ]);

    $this->post(route('events.attend', $event), [
        'password' => 'test123',
    ])
        ->assertRedirect(route('login'));
});

it('can mark attendance with correct password', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
        'starting_at' => now(),
        'ending_at' => now()->addHours(2),
    ]);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), [
            'password' => 'test123',
        ]);

    $response->assertRedirect()
        ->assertSessionHas('success', 'Attendance marked successfully!');

    expect($event->attendees()->where('user_id', $user->id)->exists())->toBeTrue();
});

it('cannot mark attendance with wrong password', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
        'starting_at' => now(),
        'ending_at' => now()->addHours(2),
    ]);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), [
            'password' => 'wrongpassword',
        ]);

    $response->assertRedirect()
        ->assertSessionHasErrors(['password' => 'Invalid event password.']);

    expect($event->attendees()->where('user_id', $user->id)->exists())->toBeFalse();
});

it('cannot mark attendance without event password set', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => '', // No password set
        'starting_at' => now(),
        'ending_at' => now()->addHours(2),
    ]);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), [
            'password' => 'anypassword',
        ]);

    $response->assertRedirect()
        ->assertSessionHasErrors(['message' => 'Please ask the admin to set a password for this event.']);
});

it('cannot mark attendance when window is closed', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
        'starting_at' => now()->addHours(2), // Event starts in 2 hours (window not open yet)
        'ending_at' => now()->addHours(4),
    ]);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), [
            'password' => 'test123',
        ]);

    $response->assertRedirect()
        ->assertSessionHasErrors(['message' => 'Attendance window is closed.']);
});

it('cannot mark attendance twice', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
        'starting_at' => now(),
        'ending_at' => now()->addHours(2),
    ]);

    // Mark attendance first time
    $event->attendees()->attach($user);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), [
            'password' => 'test123',
        ]);

    $response->assertRedirect()
        ->assertSessionHasErrors(['message' => 'You have already marked attendance for this event.']);
});

it('validates password field is required', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test123',
    ]);

    $response = $this->actingAs($user)
        ->post(route('events.attend', $event), []);

    $response->assertRedirect()
        ->assertSessionHasErrors(['password']);
});

it('shows ranklist information correctly', function () {
    $tracker = Tracker::factory()->create([
        'title' => 'Programming Contest Tracker',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $rankList = RankList::factory()->create([
        'tracker_id' => $tracker->id,
        'keyword' => 'acm-contest',
        'description' => 'ACM Programming Contest Rankings',
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'title' => 'Programming Contest',
    ]);

    // Attach the ranklist to the event with a weight
    $event->rankLists()->attach($rankList->id, ['weight' => 1.5]);

    $response = $this->get(route('events.show', $event));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/show')
            ->has('event.rank_lists', 1)
            ->has('event.rank_lists.0', fn ($rankListData) => $rankListData
                ->where('keyword', 'acm-contest')
                ->where('description', 'ACM Programming Contest Rankings')
                ->where('weight', 1.5)
                ->has('tracker', fn ($trackerData) => $trackerData
                    ->where('title', 'Programming Contest Tracker')
                    ->etc()
                )
                ->etc()
            )
        );
});

it('shows empty ranklist when no ranklists are associated', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
    ]);

    $response = $this->get(route('events.show', $event));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/show')
            ->has('event.rank_lists', 0)
        );
});
