<?php

use App\Models\User;

it('can display login page', function () {
    $response = $this->get('/login');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('auth/login');
    });
});

it('can login with email', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'login' => 'test@example.com',
        'password' => 'password',
    ]);

    $response->assertRedirect('/');
    $this->assertAuthenticatedAs($user);
});

it('can login with username', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'login' => 'testuser',
        'password' => 'password',
    ]);

    $response->assertRedirect('/');
    $this->assertAuthenticatedAs($user);
});

it('cannot login with invalid credentials', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'login' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors(['login']);
    $this->assertGuest();
});

it('can logout', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->post('/logout');

    $response->assertRedirect('/');
    $this->assertGuest();
});

it('redirects authenticated users away from login page', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get('/login');

    $response->assertRedirect('/');
});

it('validates required fields', function () {
    $response = $this->post('/login', [
        'login' => '',
        'password' => '',
    ]);

    $response->assertSessionHasErrors(['login', 'password']);
});

it('rate limits login attempts', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    // Make multiple failed login attempts
    for ($i = 0; $i < 6; $i++) {
        $this->post('/login', [
            'login' => 'test@example.com',
            'password' => 'wrong-password',
        ]);
    }

    $response = $this->post('/login', [
        'login' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors(['login']);
    // Expect throttling error message
    $errors = session('errors')->get('login');
    expect($errors[0])->toContain('Too many login attempts');
});

it('remembers user when remember me is checked', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'login' => 'test@example.com',
        'password' => 'password',
        'remember' => true,
    ]);

    $response->assertRedirect('/');
    $this->assertAuthenticatedAs($user);

    // Check that remember token is set
    expect($user->fresh()->remember_token)->not->toBeNull();
});
