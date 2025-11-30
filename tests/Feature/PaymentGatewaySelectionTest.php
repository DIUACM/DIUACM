<?php

use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('shows the payment gateway selection page for pending registration', function () {
    $user = User::factory()->create();
    $contest = InternalContest::factory()->create(['registration_fee' => 100]);
    $registration = InternalContestRegistration::factory()->create([
        'user_id' => $user->id,
        'internal_contest_id' => $contest->id,
    ]);

    actingAs($user)
        ->get("/payments/registrations/{$registration->id}/select-gateway")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('payments/select-gateway')
            ->has('registration')
            ->where('registration.id', $registration->id)
            ->where('registration.amount', '100.00')
        );
});

it('redirects if registration is free', function () {
    $user = User::factory()->create();
    $contest = InternalContest::factory()->create(['registration_fee' => 0]);
    $registration = InternalContestRegistration::factory()->create([
        'user_id' => $user->id,
        'internal_contest_id' => $contest->id,
    ]);

    actingAs($user)
        ->get("/payments/registrations/{$registration->id}/select-gateway")
        ->assertRedirect();
});

it('forbids access to other users registration', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $contest = InternalContest::factory()->create(['registration_fee' => 100]);
    $registration = InternalContestRegistration::factory()->create([
        'user_id' => $user1->id,
        'internal_contest_id' => $contest->id,
    ]);

    actingAs($user2)
        ->get("/payments/registrations/{$registration->id}/select-gateway")
        ->assertForbidden();
});

it('requires authentication', function () {
    $contest = InternalContest::factory()->create(['registration_fee' => 100]);
    $registration = InternalContestRegistration::factory()->create([
        'internal_contest_id' => $contest->id,
    ]);

    get("/payments/registrations/{$registration->id}/select-gateway")
        ->assertRedirect('/login');
});
