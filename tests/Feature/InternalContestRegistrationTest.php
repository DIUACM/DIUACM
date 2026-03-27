<?php

use App\Enums\VisibilityStatus;
use App\Models\InternalContest;
use App\Models\User;

it('marks a contest as upcoming before registration opens', function () {
    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->addDay(),
        'registration_deadline' => now()->addWeek(),
    ]);

    $response = $this->get(route('internal-contests.show', $contest));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('internal-contests/show')
        ->where('contest.is_registration_open', false)
        ->where('contest.registration_status', 'upcoming')
    );
});

it('shows an upcoming message when registration has not opened yet', function () {
    $user = User::factory()->create();

    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->addDay(),
        'registration_deadline' => now()->addWeek(),
    ]);

    $this->actingAs($user)
        ->get(route('internal-contests.registration', $contest))
        ->assertRedirect(route('internal-contests.show', $contest))
        ->assertSessionHas('inertia.flash_data.toast.type', 'error')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Registration has not opened for this contest yet.');
});

it('uses authenticated user email when registering for internal contest', function () {
    $user = User::factory()->create([
        'email' => 'authenticateduser@example.com',
    ]);

    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->subDay(),
        'registration_deadline' => now()->addWeek(),
        'registration_fee' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('internal-contests.store-registration', $contest->slug), [
        'student_id' => '123-45-6789',
        'name' => 'Test User',
        'phone' => '01712345678',
        'department' => 'CSE',
        'section' => 'A',
        'lab_teacher_name' => 'Dr. John Doe',
        'tshirt_size' => 'L',
        'gender' => 'male',
        'transport_service_required' => false,
    ]);

    $response->assertRedirect(route('internal-contests.my-registration', $contest->slug));

    $this->assertDatabaseHas('internal_contest_registrations', [
        'internal_contest_id' => $contest->id,
        'user_id' => $user->id,
        'email' => 'authenticateduser@example.com',
    ]);
});

it('ignores submitted email and uses authenticated user email', function () {
    $user = User::factory()->create([
        'email' => 'authenticateduser@example.com',
    ]);

    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->subDay(),
        'registration_deadline' => now()->addWeek(),
        'registration_fee' => 0,
    ]);

    // Try to submit a different email
    $response = $this->actingAs($user)->post(route('internal-contests.store-registration', $contest->slug), [
        'student_id' => '123-45-6789',
        'name' => 'Test User',
        'email' => 'fake@example.com', // This should be ignored
        'phone' => '01712345678',
        'department' => 'CSE',
        'section' => 'A',
        'lab_teacher_name' => 'Dr. John Doe',
        'tshirt_size' => 'L',
        'gender' => 'male',
        'transport_service_required' => false,
    ]);

    $response->assertRedirect(route('internal-contests.my-registration', $contest->slug));

    // Should use authenticated user's email, not the submitted one
    $this->assertDatabaseHas('internal_contest_registrations', [
        'internal_contest_id' => $contest->id,
        'user_id' => $user->id,
        'email' => 'authenticateduser@example.com',
    ]);

    $this->assertDatabaseMissing('internal_contest_registrations', [
        'email' => 'fake@example.com',
    ]);
});

it('prevents user from registering with another users email', function () {
    $user1 = User::factory()->create([
        'email' => 'user1@example.com',
    ]);

    $user2 = User::factory()->create([
        'email' => 'user2@example.com',
    ]);

    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->subDay(),
        'registration_deadline' => now()->addWeek(),
        'registration_fee' => 0,
    ]);

    // User 1 registers
    $this->actingAs($user1)->post(route('internal-contests.store-registration', $contest->slug), [
        'student_id' => '123-45-6789',
        'name' => 'User One',
        'phone' => '01712345678',
        'department' => 'CSE',
        'section' => 'A',
        'lab_teacher_name' => 'Dr. John Doe',
        'tshirt_size' => 'L',
        'gender' => 'male',
        'transport_service_required' => false,
    ]);

    // Verify user1's email is stored
    $this->assertDatabaseHas('internal_contest_registrations', [
        'internal_contest_id' => $contest->id,
        'user_id' => $user1->id,
        'email' => 'user1@example.com',
    ]);

    // User 2 tries to register with user1's email (should be ignored and use their own)
    $this->actingAs($user2)->post(route('internal-contests.store-registration', $contest->slug), [
        'student_id' => '987-65-4321',
        'name' => 'User Two',
        'email' => 'user1@example.com', // Trying to use user1's email
        'phone' => '01787654321',
        'department' => 'EEE',
        'section' => 'B',
        'lab_teacher_name' => 'Dr. Jane Smith',
        'tshirt_size' => 'M',
        'gender' => 'female',
        'transport_service_required' => false,
    ]);

    // User 2's registration should have their own email, not user1's
    $this->assertDatabaseHas('internal_contest_registrations', [
        'internal_contest_id' => $contest->id,
        'user_id' => $user2->id,
        'email' => 'user2@example.com',
    ]);

    // Verify we have exactly 2 registrations with different emails
    expect($contest->registrations()->count())->toBe(2);
    expect($contest->registrations()->where('email', 'user1@example.com')->count())->toBe(1);
    expect($contest->registrations()->where('email', 'user2@example.com')->count())->toBe(1);
});

it('only allows authenticated user to register for themselves', function () {
    $user = User::factory()->create([
        'email' => 'myemail@example.com',
        'student_id' => '111-11-1111',
    ]);

    $contest = InternalContest::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'registration_start_time' => now()->subDay(),
        'registration_deadline' => now()->addWeek(),
        'registration_fee' => 0,
    ]);

    $response = $this->actingAs($user)->post(route('internal-contests.store-registration', $contest->slug), [
        'student_id' => '123-45-6789',
        'name' => 'Test User',
        'phone' => '01712345678',
        'department' => 'CSE',
        'section' => 'A',
        'lab_teacher_name' => 'Dr. John Doe',
        'tshirt_size' => 'L',
        'gender' => 'male',
        'transport_service_required' => false,
    ]);

    $response->assertRedirect(route('internal-contests.my-registration', $contest->slug));

    // Verify the registration belongs to the authenticated user
    $registration = $contest->registrations()->first();

    expect($registration->user_id)->toBe($user->id);
    expect($registration->email)->toBe($user->email);
    expect($registration->email)->toBe('myemail@example.com');
});
