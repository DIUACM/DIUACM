<?php

use App\Models\Programmer;
use App\Models\User;

it('displays the programmers index page', function () {
    $programmers = Programmer::factory()->count(3)->create();

    $response = $this->get('/programmers');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 3)
            ->has('pagination')
            ->has('filters')
        );
});

it('filters programmers by search term', function () {
    $programmer1 = Programmer::factory()->create(['name' => 'John Doe', 'username' => 'johndoe']);
    $programmer2 = Programmer::factory()->create(['name' => 'Jane Smith', 'username' => 'janesmith']);

    $response = $this->get('/programmers?search=John');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
            ->where('programmers.0.name', 'John Doe')
        );
});

it('filters programmers by skills', function () {
    $programmer1 = Programmer::factory()->create(['skills' => ['PHP', 'Laravel', 'JavaScript']]);
    $programmer2 = Programmer::factory()->create(['skills' => ['Python', 'Django', 'React']]);

    $response = $this->get('/programmers?skills=PHP');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('filters programmers by location', function () {
    $programmer1 = Programmer::factory()->create(['location' => 'Dhaka, Bangladesh']);
    $programmer2 = Programmer::factory()->create(['location' => 'New York, USA']);

    $response = $this->get('/programmers?location=Dhaka');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('filters programmers available for hire', function () {
    $programmer1 = Programmer::factory()->create(['is_available_for_hire' => true]);
    $programmer2 = Programmer::factory()->create(['is_available_for_hire' => false]);

    $response = $this->get('/programmers?available_for_hire=1');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('displays the programmer show page', function () {
    $programmer = Programmer::factory()->create();

    $response = $this->get("/programmers/{$programmer->id}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/show')
            ->has('programmer')
            ->where('programmer.id', $programmer->id)
        );
});

it('returns 404 for non-existent programmer', function () {
    $response = $this->get('/programmers/999');

    $response->assertStatus(404);
});

it('paginates programmers correctly', function () {
    Programmer::factory()->count(15)->create();

    $response = $this->get('/programmers');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 12) // default per page
            ->where('pagination.page', 1)
            ->where('pagination.pages', 2)
            ->where('pagination.total', 15)
        );
});

it('searches programmers by codeforces handle', function () {
    $programmer1 = Programmer::factory()->create(['codeforces_handle' => 'tourist']);
    $programmer2 = Programmer::factory()->create(['codeforces_handle' => 'petr']);

    $response = $this->get('/programmers?search=tourist');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('searches programmers by atcoder handle', function () {
    $programmer1 = Programmer::factory()->create(['atcoder_handle' => 'tourist']);
    $programmer2 = Programmer::factory()->create(['atcoder_handle' => 'petr']);

    $response = $this->get('/programmers?search=tourist');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('searches programmers by bio content', function () {
    $programmer1 = Programmer::factory()->create(['bio' => 'I am a competitive programmer']);
    $programmer2 = Programmer::factory()->create(['bio' => 'I am a web developer']);

    $response = $this->get('/programmers?search=competitive');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/index')
            ->has('programmers', 1)
        );
});

it('validates search parameters', function () {
    $response = $this->get('/programmers?search=' . str_repeat('a', 256));

    $response->assertStatus(302); // validation error redirect
});

it('loads programmer with relationships', function () {
    $programmer = Programmer::factory()->create();
    
    // Note: In a real scenario, you might want to create related data
    // For now, we're just testing that the show method works

    $response = $this->get("/programmers/{$programmer->id}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('programmers/show')
            ->has('programmer')
        );
});