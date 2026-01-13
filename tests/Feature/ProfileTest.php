<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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
        ->put('/profile', [
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
        ->put('/profile', [
            'name' => '', // Required field
            'username' => 'ab', // Too short
        ])
        ->assertStatus(302)
        ->assertSessionHasErrors(['name', 'username']);
});

it('prevents duplicate usernames', function () {
    $existingUser = User::factory()->create(['username' => 'existinguser']);
    $user = User::factory()->create(['username' => 'myusername']);

    $this->actingAs($user)
        ->put('/profile', [
            'name' => $user->name,
            'username' => 'existinguser', // Duplicate username
        ])
        ->assertStatus(302)
        ->assertSessionHasErrors(['username']);
});

it('can display the change password page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/profile/change-password')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('profile/change-password'));
});

it('can change password', function () {
    $user = User::factory()->create([]);

    $this->actingAs($user)
        ->post('/profile/change-password', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
        ])
        ->assertRedirect();

    $user->refresh();

    expect(Hash::check('newpassword', $user->password))->toBeTrue();
});

it('validates password confirmation', function () {
    $user = User::factory()->create([]);

    $this->actingAs($user)
        ->post('/profile/change-password', [
            'password' => 'newpassword',
            'password_confirmation' => 'differentpassword',
        ])
        ->assertStatus(302)
        ->assertSessionHasErrors(['password']);
});

it('can upload a profile picture separately', function () {
    Storage::fake('media');

    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('avatar.jpg');

    $this->actingAs($user)
        ->post('/profile/avatar', [
            'avatar' => $file,
        ])
        ->assertRedirect();

    expect($user->fresh()->getFirstMediaUrl('profile_picture'))->not->toBeEmpty();
});

it('requires avatar for separate upload endpoint', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/profile/avatar', [])
        ->assertStatus(302)
        ->assertSessionHasErrors(['avatar']);
});
