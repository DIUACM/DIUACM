<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;

it('redirects to google oauth', function () {
    $response = $this->get('/auth/google');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('accounts.google.com');
});

it('creates new user from google oauth', function () {
    // Mock the Socialite Google user
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('123456789');
    $googleUser->shouldReceive('getEmail')->andReturn('john@example.com');
    $googleUser->shouldReceive('getName')->andReturn('John Doe');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/');

    // Check if user was created
    $user = User::where('email', 'john@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('John Doe');
    expect($user->username)->toBe('john');

    // Check if user is authenticated
    $this->assertAuthenticatedAs($user);
});

it('logs in existing user from google oauth', function () {
    // Create existing user
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'name' => 'Existing User',
    ]);

    // Mock the Socialite Google user
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('987654321');
    $googleUser->shouldReceive('getEmail')->andReturn('existing@example.com');
    $googleUser->shouldReceive('getName')->andReturn('Existing User Updated');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/');

    // Check if user is authenticated
    $this->assertAuthenticatedAs($existingUser);
});

it('handles google oauth failure gracefully', function () {
    // Mock Socialite to throw an exception
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andThrow(new Exception('OAuth failed'));

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/login');
    $response->assertSessionHasErrors(['login']);
    $this->assertGuest();
});

it('generates unique username for google oauth users', function () {
    // Create a user with the username that would conflict
    User::factory()->create(['username' => 'jane']);

    // Mock the Socialite Google user
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('555666777');
    $googleUser->shouldReceive('getEmail')->andReturn('jane@example.com');
    $googleUser->shouldReceive('getName')->andReturn('Jane Doe');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/');

    // Check if user was created with unique username
    $user = User::where('email', 'jane@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->username)->toBe('jane1'); // Should be incremented to avoid conflict
});
