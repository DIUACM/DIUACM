<?php

use App\Models\User;

it('can display the profile edit page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/profile/edit');

    $response->assertOk();
    $response->assertInertia(fn ($assert) => $assert
        ->component('profile/edit')
        ->has('user')
        ->where('user.email', $user->email)
        ->where('user.name', $user->name)
        ->where('user.username', $user->username)
    );
});

it('can update profile information', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'username' => 'oldusername',
    ]);

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => 'New Name',
        'username' => 'newusername',
        'gender' => 'male',
        'phone' => '+1234567890',
        'codeforces_handle' => 'newhandle',
        'atcoder_handle' => 'atcoder_handle',
        'vjudge_handle' => 'vjudge_handle',
        'department' => 'Computer Science',
        'student_id' => '12345',
    ]);

    $response->assertRedirect('/profile/edit');
    $response->assertSessionHas('success', 'Profile updated successfully!');

    $user->refresh();
    expect($user->name)->toBe('New Name');
    expect($user->username)->toBe('newusername');
    expect($user->gender->value)->toBe('male');
    expect($user->phone)->toBe('+1234567890');
    expect($user->codeforces_handle)->toBe('newhandle');
    expect($user->atcoder_handle)->toBe('atcoder_handle');
    expect($user->vjudge_handle)->toBe('vjudge_handle');
    expect($user->department)->toBe('Computer Science');
    expect($user->student_id)->toBe('12345');
});

it('validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => '',
        'username' => '',
    ]);

    $response->assertSessionHasErrors(['name', 'username']);
});

it('validates unique username', function () {
    $existingUser = User::factory()->create(['username' => 'existinguser']);
    $user = User::factory()->create(['username' => 'currentuser']);

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => 'Valid Name',
        'username' => 'existinguser', // Try to use existing username
    ]);

    $response->assertSessionHasErrors(['username']);
});

it('allows keeping the same username', function () {
    $user = User::factory()->create([
        'name' => 'Current Name',
        'username' => 'currentuser',
    ]);

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => 'Updated Name',
        'username' => 'currentuser', // Keep the same username
    ]);

    $response->assertRedirect('/profile/edit');
    $response->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->name)->toBe('Updated Name');
    expect($user->username)->toBe('currentuser');
});

it('requires authentication to access profile edit', function () {
    $response = $this->get('/profile/edit');

    $response->assertRedirect('/login');
});

it('requires authentication to update profile', function () {
    $response = $this->patch('/profile', [
        'name' => 'Some Name',
        'username' => 'someusername',
    ]);

    $response->assertRedirect('/login');
});
