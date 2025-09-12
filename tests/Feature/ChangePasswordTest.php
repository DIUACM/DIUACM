<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('can display the change password page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/profile/change-password');

    $response->assertOk();
    $response->assertInertia(fn ($assert) => $assert
        ->component('profile/change-password')
    );
});

it('can change password with valid data', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword'),
    ]);

    $response = $this->actingAs($user)->patch('/profile/change-password', [
        'current_password' => 'oldpassword',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertRedirect('/profile/change-password');
    $response->assertSessionHas('success', 'Password changed successfully!');

    $user->refresh();
    expect(Hash::check('newpassword123', $user->password))->toBeTrue();
});

it('validates current password is correct', function () {
    $user = User::factory()->create([
        'password' => Hash::make('correctpassword'),
    ]);

    $response = $this->actingAs($user)->patch('/profile/change-password', [
        'current_password' => 'wrongpassword',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors(['current_password']);
    
    $user->refresh();
    expect(Hash::check('correctpassword', $user->password))->toBeTrue();
});

it('validates password confirmation matches', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword'),
    ]);

    $response = $this->actingAs($user)->patch('/profile/change-password', [
        'current_password' => 'oldpassword',
        'password' => 'newpassword123',
        'password_confirmation' => 'differentpassword',
    ]);

    $response->assertSessionHasErrors(['password']);
});

it('validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch('/profile/change-password', [
        'current_password' => '',
        'password' => '',
        'password_confirmation' => '',
    ]);

    $response->assertSessionHasErrors(['current_password', 'password', 'password_confirmation']);
});

it('validates password strength', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword'),
    ]);

    $response = $this->actingAs($user)->patch('/profile/change-password', [
        'current_password' => 'oldpassword',
        'password' => '123', // Too short
        'password_confirmation' => '123',
    ]);

    $response->assertSessionHasErrors(['password']);
});

it('requires authentication to access change password page', function () {
    $response = $this->get('/profile/change-password');

    $response->assertRedirect('/login');
});

it('requires authentication to change password', function () {
    $response = $this->patch('/profile/change-password', [
        'current_password' => 'oldpassword',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertRedirect('/login');
});
