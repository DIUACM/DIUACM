<?php

use App\Models\Event;
use App\Models\User;

it('displays correct attendance timestamps', function () {
    // Create an event and user
    $event = Event::factory()->create([
        'open_for_attendance' => true,
        'starting_at' => now()->addHour(),
        'ending_at' => now()->addHours(2),
    ]);

    $user = User::factory()->create();

    // Attach the user to the event with a specific timestamp
    $attendanceTime = now()->subMinutes(30);
    $event->attendees()->attach($user->id, [
        'created_at' => $attendanceTime,
        'updated_at' => $attendanceTime,
    ]);

    // Test the controller method directly
    $controller = new \App\Http\Controllers\EventController;
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('getAttendanceData');
    $method->setAccessible(true);
    $result = $method->invoke($controller, $event);

    expect($result['attendees'])->toHaveCount(1);

    $attendee = $result['attendees'][0];
    expect($attendee['attended_at'])->toBeString();
    expect($attendee['attended_at'])->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/'); // ISO format

    // Verify the timestamp is not null or empty
    expect($attendee['attended_at'])->not->toBeEmpty();

    // Verify the timestamp is close to our expected time (within 1 second due to possible precision differences)
    $actualTime = new DateTime($attendee['attended_at']);
    $expectedDateTime = $attendanceTime->toDateTime();
    $timeDiff = abs($actualTime->getTimestamp() - $expectedDateTime->getTimestamp());
    expect($timeDiff)->toBeLessThanOrEqual(1);
});
