<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can attend an event', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create();

    // Attach user to event
    $event->attendees()->attach($user->id);

    // Check attendance using database queries
    expect($event->attendees()->count())->toBe(1);
    expect($event->attendees()->first()->id)->toBe($user->id);
    expect($user->attendedEvents()->count())->toBe(1);
    expect($user->attendedEvents()->first()->id)->toBe($event->id);
});

test('event attendance is recorded with timestamp', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create();

    $event->attendees()->attach($user->id);

    $attendanceRecord = $event->attendees()->where('user_id', $user->id)->first();

    expect($attendanceRecord->pivot->created_at)->not->toBeNull();
    expect($attendanceRecord->pivot->updated_at)->not->toBeNull();
});

test('user cannot attend same event twice', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create();

    $event->attendees()->attach($user->id);

    // Try to attach again - this will work because attach doesn't prevent duplicates,
    // but sync() or syncWithoutDetaching() would be better for this use case
    // However, our unique constraint in the database prevents duplicates

    expect(function () use ($event, $user) {
        $event->attendees()->attach($user->id);
    })->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);

    $event->load('attendees');
    expect($event->attendees)->toHaveCount(1);
});

test('user can be removed from event attendance', function () {
    $user = User::factory()->create();
    $event = Event::factory()->create();

    $event->attendees()->attach($user->id);
    expect($event->attendees()->count())->toBe(1);

    $event->attendees()->detach($user->id);
    expect($event->attendees()->count())->toBe(0);
});
