<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('displays programmers list page', function () {
    User::factory()->count(3)->withHandles()->create();

    get('/programmers')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/index')
                ->has('programmers.data', 3)
        );
});

it('can search programmers by name', function () {
    User::factory()->withHandles()->create(['name' => 'John Doe']);
    User::factory()->withHandles()->create(['name' => 'Jane Smith']);

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

it('only shows users with at least one programming handle', function () {
    // Users with handles - should be shown
    User::factory()->create([
        'name' => 'Alice',
        'codeforces_handle' => 'alice_cf',
        'atcoder_handle' => null,
        'vjudge_handle' => null,
    ]);
    User::factory()->create([
        'name' => 'Bob',
        'codeforces_handle' => null,
        'atcoder_handle' => 'bob_ac',
        'vjudge_handle' => null,
    ]);
    User::factory()->create([
        'name' => 'Charlie',
        'codeforces_handle' => null,
        'atcoder_handle' => null,
        'vjudge_handle' => 'charlie_vj',
    ]);

    // Users without any handles - should NOT be shown
    User::factory()->create([
        'name' => 'Dave',
        'codeforces_handle' => null,
        'atcoder_handle' => null,
        'vjudge_handle' => null,
    ]);
    User::factory()->create([
        'name' => 'Eve',
        'codeforces_handle' => '',
        'atcoder_handle' => '',
        'vjudge_handle' => '',
    ]);

    get('/programmers')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('programmers/index')
                ->has('programmers.data', 3)
        );
});

it('orders programmers by rating then name', function () {
    User::factory()->withHandles()->create(['name' => 'Alice', 'max_cf_rating' => 1200]);
    User::factory()->withHandles()->create(['name' => 'Bob', 'max_cf_rating' => 1500]);
    User::factory()->withHandles()->create(['name' => 'Charlie', 'max_cf_rating' => -1]);

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
