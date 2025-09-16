<?php

use App\Models\Gallery;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\get;

it('returns galleries index component', function () {
    Gallery::factory()->published()->create();

    get('/galleries')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('galleries/index'));
});

it('returns gallery show component and route works', function () {
    $gallery = Gallery::factory()->published()->create();

    get(route('gallery.show', $gallery->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('galleries/show'));
});
