<?php

use App\Models\Gallery;
use Inertia\Testing\AssertableInertia as Assert;

test('can display gallery index page', function () {
    $response = test()->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/index')
        ->has('galleries')
    );
});

test('displays published galleries on index page', function () {
    $publishedGallery = Gallery::factory()->published()->create([
        'title' => 'Published Gallery',
        'slug' => 'published-gallery',
    ]);

    $draftGallery = Gallery::factory()->draft()->create([
        'title' => 'Draft Gallery',
        'slug' => 'draft-gallery',
    ]);

    $response = test()->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/index')
        ->has('galleries', 1)
        ->where('galleries.0.title', 'Published Gallery')
        ->where('galleries.0.slug', 'published-gallery')
        ->has('galleries.0.images_count')
        ->has('galleries.0.cover_image')
        ->has('galleries.0.created_at')
    );
});

test('does not display draft galleries on index page', function () {
    Gallery::factory()->draft()->create([
        'title' => 'Draft Gallery',
    ]);

    $response = test()->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/index')
        ->has('galleries', 0)
    );
});

test('galleries are ordered by creation date descending', function () {
    $olderGallery = Gallery::factory()->published()->create([
        'title' => 'Older Gallery',
        'created_at' => now()->subDays(2),
    ]);

    $newerGallery = Gallery::factory()->published()->create([
        'title' => 'Newer Gallery',
        'created_at' => now()->subDay(),
    ]);

    $response = test()->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/index')
        ->has('galleries', 2)
        ->where('galleries.0.title', 'Newer Gallery')
        ->where('galleries.1.title', 'Older Gallery')
    );
});

test('gallery index shows correct image count', function () {
    $galleryWithManyImages = Gallery::factory()->published()->withManyImages()->create([
        'title' => 'Gallery with Many Images',
        'created_at' => now()->subDay(), // older
    ]);

    $galleryWithoutImages = Gallery::factory()->published()->withoutImages()->create([
        'title' => 'Gallery without Images',
        'created_at' => now(), // newer
    ]);

    $response = test()->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/index')
        ->has('galleries', 2)
        ->where('galleries.0.images_count', 0) // without images (newest first)
        ->where('galleries.1.images_count', 6) // with many images
    );
});
