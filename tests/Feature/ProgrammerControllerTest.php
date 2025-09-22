<?php

use App\Models\User;

it('displays the programmers list page', function () {
    $response = $this->get('/programmers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->component('programmers/index')
            ->has('programmers')
            ->has('filters');
    });
});

it('orders programmers by max cf rating descending', function () {
    User::factory()->create(['max_cf_rating' => 1500, 'name' => 'John Doe']);
    User::factory()->create(['max_cf_rating' => 2000, 'name' => 'Jane Smith']);
    User::factory()->create(['max_cf_rating' => 1000, 'name' => 'Bob Wilson']);

    $response = $this->get('/programmers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('programmers.data', 3);

        // The highest rated programmer should be first
        $page->where('programmers.data.0.max_cf_rating', 2000)
            ->where('programmers.data.0.name', 'Jane Smith');
    });
});

it('searches programmers by name', function () {
    User::factory()->create(['name' => 'John Doe', 'max_cf_rating' => 1500]);
    User::factory()->create(['name' => 'Jane Smith', 'max_cf_rating' => 2000]);

    $response = $this->get('/programmers?search=John');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('programmers.data', 1)
            ->where('programmers.data.0.name', 'John Doe');
    });
});

it('searches programmers by username', function () {
    User::factory()->create(['username' => 'johndoe123', 'name' => 'John Doe']);
    User::factory()->create(['username' => 'janesmith456', 'name' => 'Jane Smith']);

    $response = $this->get('/programmers?search=johndoe');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('programmers.data', 1)
            ->where('programmers.data.0.username', 'johndoe123');
    });
});

it('includes correct user data in response', function () {
    $user = User::factory()->create([
        'name' => 'Test User',
        'username' => 'testuser',
        'student_id' => 'DIU-12345',
        'department' => 'CSE',
        'max_cf_rating' => 1800,
    ]);

    $response = $this->get('/programmers');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) use ($user) {
        $page->has('programmers.data.0.id')
            ->has('programmers.data.0.name')
            ->has('programmers.data.0.username')
            ->has('programmers.data.0.student_id')
            ->has('programmers.data.0.department')
            ->has('programmers.data.0.max_cf_rating')
            ->has('programmers.data.0.profile_picture')
            ->where('programmers.data.0.name', $user->name)
            ->where('programmers.data.0.username', $user->username)
            ->where('programmers.data.0.student_id', $user->student_id)
            ->where('programmers.data.0.department', $user->department)
            ->where('programmers.data.0.max_cf_rating', $user->max_cf_rating);
    });
});
