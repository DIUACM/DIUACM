<?php

use App\Enums\VisibilityStatus;
use App\Models\Event;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('allows authenticated user to submit attendance with correct password during attendance window', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertRedirect(route('events.show', $event))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Attendance confirmed successfully!');

    assertDatabaseHas('event_attendance', [
        'event_id' => $event->id,
        'user_id' => $this->user->id,
    ]);
});

it('prevents unauthenticated user from submitting attendance', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    post(route('events.attendance.store', $event), [
        'password' => 'test-password-123',
    ])->assertRedirect(route('login'));
});

it('rejects attendance submission with incorrect password', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'correct-password',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'wrong-password',
        ])
        ->assertSessionHasErrors(['password' => 'Invalid event password.']);

    expect($event->attendees()->where('user_id', $this->user->id)->exists())->toBeFalse();
});

it('requires password field', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [])
        ->assertSessionHasErrors(['password']);
});

it('prevents duplicate attendance submission', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    // Submit attendance first time
    $event->attendees()->attach($this->user->id);

    // Try to submit again
    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertSessionHasErrors(['attendance' => 'You have already given attendance for this event.']);
});

it('rejects attendance when event is not published', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::DRAFT,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertSessionHasErrors(['event']);
});

it('rejects attendance when attendance is not enabled for event', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => false,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertSessionHasErrors(['attendance' => 'Attendance is not enabled for this event.']);
});

it('rejects attendance when attendance window is not open yet', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addHour(),
        'ending_at' => now()->addHours(2),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertSessionHasErrors(['attendance' => 'Attendance window is not currently open.']);
});

it('rejects attendance when attendance window has closed', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->subHours(3),
        'ending_at' => now()->subHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertSessionHasErrors(['attendance' => 'Attendance window is not currently open.']);
});

it('rejects attendance when event password is not set', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => null,
        'starting_at' => now()->addMinutes(10),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'any-password',
        ])
        ->assertSessionHasErrors(['attendance' => 'Event password is not set. Please contact the event organizer.']);
});

it('allows attendance exactly 15 minutes before event starts', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->addMinutes(15),
        'ending_at' => now()->addHour(),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertRedirect(route('events.show', $event))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Attendance confirmed successfully!');

    assertDatabaseHas('event_attendance', [
        'event_id' => $event->id,
        'user_id' => $this->user->id,
    ]);
});

it('allows attendance exactly 20 minutes after event ends', function () {
    $event = Event::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'open_for_attendance' => true,
        'event_password' => 'test-password-123',
        'starting_at' => now()->subHour(),
        'ending_at' => now()->subMinutes(19),
    ]);

    actingAs($this->user)
        ->post(route('events.attendance.store', $event), [
            'password' => 'test-password-123',
        ])
        ->assertRedirect(route('events.show', $event))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Attendance confirmed successfully!');

    assertDatabaseHas('event_attendance', [
        'event_id' => $event->id,
        'user_id' => $this->user->id,
    ]);
});
