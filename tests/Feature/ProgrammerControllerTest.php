<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('displays programmers list page', function () {
    User::factory()->count(3)->create();

    get('/programmers')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/index')
                ->has('programmers.data', 3)
        );
});

it('can search programmers by name', function () {
    User::factory()->create(['name' => 'John Doe']);
    User::factory()->create(['name' => 'Jane Smith']);

    get('/programmers?search=John')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/index')
                ->has('programmers.data', 1)
                ->where('programmers.data.0.name', 'John Doe')
        );
});

it('displays programmer details page', function () {
    $user = User::factory()->create([
        'name' => 'John Doe',
        'username' => 'johndoe',
        'codeforces_handle' => 'johncf',
        'max_cf_rating' => 1500,
    ]);

    get("/programmers/{$user->username}")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/show')
                ->where('programmer.name', 'John Doe')
                ->where('programmer.username', 'johndoe')
                ->where('programmer.codeforces_handle', 'johncf')
                ->where('programmer.max_cf_rating', 1500)
        );
});

it('orders programmers by rating then name', function () {
    User::factory()->create(['name' => 'Alice', 'max_cf_rating' => 1200]);
    User::factory()->create(['name' => 'Bob', 'max_cf_rating' => 1500]);
    User::factory()->create(['name' => 'Charlie', 'max_cf_rating' => -1]);

    get('/programmers')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/index')
                ->where('programmers.data.0.name', 'Bob')
                ->where('programmers.data.1.name', 'Alice')
                ->where('programmers.data.2.name', 'Charlie')
        );
});
