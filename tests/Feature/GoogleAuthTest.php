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
    $googleUser->shouldReceive('getEmail')->andReturn('john.doe@diu.edu.bd');
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
    $user = User::where('email', 'john.doe@diu.edu.bd')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('John Doe');
    expect($user->username)->toBe('john');

    // Check if user is authenticated
    $this->assertAuthenticatedAs($user);
});

it('logs in existing user from google oauth', function () {
    // Create existing user
    $existingUser = User::factory()->create([
        'email' => 'existing@s.diu.edu.bd',
        'name' => 'Existing User',
    ]);

    // Mock the Socialite Google user
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('987654321');
    $googleUser->shouldReceive('getEmail')->andReturn('existing@s.diu.edu.bd');
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
    $googleUser->shouldReceive('getEmail')->andReturn('jane.smith@diu.edu.bd');
    $googleUser->shouldReceive('getName')->andReturn('Jane Smith');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/');

    // Check if user was created with unique username
    $user = User::where('email', 'jane.smith@diu.edu.bd')->first();
    expect($user)->not->toBeNull();
    expect($user->username)->toBe('jane1'); // Should be incremented to avoid conflict
});

it('rejects non-diu emails from google oauth', function () {
    // Mock the Socialite Google user with non-DIU email
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('999888777');
    $googleUser->shouldReceive('getEmail')->andReturn('user@gmail.com');
    $googleUser->shouldReceive('getName')->andReturn('External User');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/login');
    $response->assertSessionHasErrors(['login']);

    // Ensure no user was created
    $user = User::where('email', 'user@gmail.com')->first();
    expect($user)->toBeNull();

    // Ensure user is not authenticated
    $this->assertGuest();
});

it('rejects non-diu educational emails from google oauth', function () {
    // Mock the Socialite Google user with another university email
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('111222333');
    $googleUser->shouldReceive('getEmail')->andReturn('student@buet.ac.bd');
    $googleUser->shouldReceive('getName')->andReturn('BUET Student');

    // Mock the Socialite facade
    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/login');
    $response->assertSessionHasErrors(['login']);

    // Ensure no user was created
    $user = User::where('email', 'student@buet.ac.bd')->first();
    expect($user)->toBeNull();

    // Ensure user is not authenticated
    $this->assertGuest();
});

it('accepts faculty diu.edu.bd domain', function () {
    // Mock the Socialite Google user with @diu.edu.bd domain
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('111111111');
    $googleUser->shouldReceive('getEmail')->andReturn('faculty@diu.edu.bd');
    $googleUser->shouldReceive('getName')->andReturn('Faculty Member');

    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect('/');

    $user = User::where('email', 'faculty@diu.edu.bd')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('Faculty Member');
});

it('accepts student s.diu.edu.bd domain', function () {
    // Mock the Socialite Google user with @s.diu.edu.bd domain
    $googleUser = Mockery::mock('Laravel\Socialite\Two\User');
    $googleUser->shouldReceive('getId')->andReturn('222222222');
    $googleUser->shouldReceive('getEmail')->andReturn('student@s.diu.edu.bd');
    $googleUser->shouldReceive('getName')->andReturn('Student Member');

    Socialite::shouldReceive('driver')
        ->with('google')
        ->andReturnSelf()
        ->shouldReceive('user')
        ->andReturn($googleUser);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect('/');

    $user = User::where('email', 'student@s.diu.edu.bd')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('Student Member');
});
