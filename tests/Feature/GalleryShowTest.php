<?php

use App\Models\Gallery;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\get;

it('shows a published gallery with images', function () {
    $gallery = Gallery::factory()->published()->create();

    get(route('gallery.show', $gallery->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('galleries/show')
            ->where('gallery.id', $gallery->id)
            ->where('gallery.title', $gallery->title)
            ->where('gallery.slug', (string) $gallery->slug)
            ->has('gallery.images', count($gallery->attachments))
        );
});

it('returns 404 for draft gallery', function () {
    $gallery = Gallery::factory()->draft()->create();

    get(route('gallery.show', $gallery->slug))
        ->assertNotFound();
});

it('shows gallery without images gracefully', function () {
    $gallery = Gallery::factory()->published()->withoutImages()->create();

    get(route('gallery.show', $gallery->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('galleries/show')
            ->has('gallery.images', 0)
        );
});
