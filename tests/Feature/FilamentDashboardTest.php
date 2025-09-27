<?php

use App\Models\Contest;
use App\Models\Event;
use App\Models\Team;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Set the current panel to admin
    Filament::setCurrentPanel('admin');
});

it('can access dashboard when authenticated as valid filament user', function () {
    // Create a user with exact email format required for FilamentUser authorization
    $user = User::factory()->create([
        'email' => 'sourov2305101004@diu.edu.bd',
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/admin/dashboard');

    $response->assertOk()
        ->assertSee('DIUACM Dashboard');
});

it('dashboard shows correct statistics', function () {
    // Create a user with exact email format required for authorization
    $user = User::factory()->create([
        'email' => 'sourov2305101004@diu.edu.bd',
        'email_verified_at' => now(),
    ]);

    // Create some test data
    Contest::factory()->count(3)->create();
    Team::factory()->count(2)->create();
    Event::factory()->count(4)->create();

    $response = $this->actingAs($user)->get('/admin/dashboard');

    $response->assertOk()
        ->assertSee('DIUACM Dashboard')
        ->assertSee('Dashboard'); // Check for sidebar navigation
});
