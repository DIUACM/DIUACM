<?php

use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('renders the homepage', function (): void {
    $response = get(route('home'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page->component('welcome'));
});
