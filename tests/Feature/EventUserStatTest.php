<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Database\QueryException;

test('can create event user stats', function () {
    $event = Event::factory()->create();
    $user = User::factory()->create();

    $eventUserStat = EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'solves_count' => 5,
        'upsolves_count' => 3,
        'participation' => true,
    ]);

    expect($eventUserStat)
        ->event_id->toBe($event->id)
        ->user_id->toBe($user->id)
        ->solves_count->toBe(5)
        ->upsolves_count->toBe(3)
        ->participation->toBeTrue();
});

test('prevents duplicate user stats for the same event', function () {
    $event = Event::factory()->create();
    $user = User::factory()->create();

    // Create the first event user stat
    EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
    ]);

    // Attempt to create a duplicate should throw an exception
    expect(function () use ($event, $user) {
        EventUserStat::factory()->create([
            'event_id' => $event->id,
            'user_id' => $user->id,
        ]);
    })->toThrow(QueryException::class);
});

test('allows the same user to have stats for different events', function () {
    $event1 = Event::factory()->create();
    $event2 = Event::factory()->create();
    $user = User::factory()->create();

    $firstEventStat = EventUserStat::factory()->create([
        'event_id' => $event1->id,
        'user_id' => $user->id,
    ]);

    $secondEventStat = EventUserStat::factory()->create([
        'event_id' => $event2->id,
        'user_id' => $user->id,
    ]);

    expect($firstEventStat->user_id)->toBe($user->id);
    expect($secondEventStat->user_id)->toBe($user->id);
    expect($firstEventStat->event_id)->toBe($event1->id);
    expect($secondEventStat->event_id)->toBe($event2->id);
});

test('allows different users to have stats for the same event', function () {
    $event = Event::factory()->create();
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $firstUserStat = EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user1->id,
    ]);

    $secondUserStat = EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user2->id,
    ]);

    expect($firstUserStat->event_id)->toBe($event->id);
    expect($secondUserStat->event_id)->toBe($event->id);
    expect($firstUserStat->user_id)->toBe($user1->id);
    expect($secondUserStat->user_id)->toBe($user2->id);
});

test('has proper relationships', function () {
    $event = Event::factory()->create();
    $user = User::factory()->create();

    $eventUserStat = EventUserStat::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
    ]);

    expect($eventUserStat->event)->toBeInstanceOf(Event::class);
    expect($eventUserStat->user)->toBeInstanceOf(User::class);
    expect($eventUserStat->event->id)->toBe($event->id);
    expect($eventUserStat->user->id)->toBe($user->id);
});
