<?php

use App\Models\User;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        '_token' => csrf_token(),
        'login' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('home', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        '_token' => csrf_token(),
        'login' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'), [
        '_token' => csrf_token(),
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('home'));
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $this->post(route('login.store'), [
            '_token' => csrf_token(),
            'login' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(302)->assertSessionHasErrors([
            'login' => 'These credentials do not match our records.',
        ]);
    }

    $response = $this->post(route('login.store'), [
        '_token' => csrf_token(),
        'login' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors('login');

    $errors = session('errors');
    $this->assertStringContainsString('Too many login attempts', $errors->first('login'));
});
