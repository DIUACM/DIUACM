<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('can display the edit profile page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('profile/edit'));
});

it('can update profile information', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'username' => 'oldusername',
    ]);

    $this->actingAs($user)
        ->post('/profile', [
            'name' => 'New Name',
            'username' => 'newusername',
            'gender' => 'male',
            'phone' => '+1234567890',
            'codeforces_handle' => 'newhandle',
            'atcoder_handle' => 'newatcoder',
            'vjudge_handle' => 'newvjudge',
            'department' => 'Computer Science',
            'student_id' => 'CS123456',
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->name)->toBe('New Name');
    expect($user->username)->toBe('newusername');
    expect($user->gender->value)->toBe('male');
    expect($user->phone)->toBe('+1234567890');
    expect($user->codeforces_handle)->toBe('newhandle');
    expect($user->atcoder_handle)->toBe('newatcoder');
    expect($user->vjudge_handle)->toBe('newvjudge');
    expect($user->department)->toBe('Computer Science');
    expect($user->student_id)->toBe('CS123456');
});

it('requires authentication to access profile pages', function () {
    $this->get('/profile')
        ->assertRedirect();

    $this->get('/profile/change-password')
        ->assertRedirect();
});

it('validates profile update request', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/profile', [
            'name' => '', // Required field
            'username' => 'a', // Too short
        ])
        ->assertSessionHasErrors(['name', 'username']);
});

it('ensures username uniqueness', function () {
    $existingUser = User::factory()->create(['username' => 'existinguser']);
    $user = User::factory()->create(['username' => 'currentuser']);

    $this->actingAs($user)
        ->post('/profile', [
            'name' => 'Test Name',
            'username' => 'existinguser', // Should fail as it's taken
        ])
        ->assertSessionHasErrors(['username']);
});

it('allows user to keep their own username', function () {
    $user = User::factory()->create(['username' => 'myusername']);

    $this->actingAs($user)
        ->post('/profile', [
            'name' => 'Updated Name',
            'username' => 'myusername', // Same username should be allowed
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

it('can display the change password page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/profile/change-password')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('profile/change-password'));
});

it('can update password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword'),
    ]);

    $oldHashedPassword = $user->password;

    $this->actingAs($user)
        ->post('/profile/change-password', [
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->password)->not->toBe($oldHashedPassword);
    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();
});

it('validates password change request', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/profile/change-password', [
            'password' => 'weak', // Too weak
            'password_confirmation' => 'different', // Doesn't match
        ])
        ->assertSessionHasErrors(['password']);
});

it('requires password confirmation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/profile/change-password', [
            'password' => 'NewPassword123!',
            'password_confirmation' => 'DifferentPassword123!',
        ])
        ->assertSessionHasErrors(['password']);
});
