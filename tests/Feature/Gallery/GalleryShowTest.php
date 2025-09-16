<?php

use App\Models\Gallery;
use Inertia\Testing\AssertableInertia as Assert;

test('can display gallery show page for published gallery', function () {
    $gallery = Gallery::factory()->published()->create([
        'title' => 'Test Gallery',
        'slug' => 'test-gallery',
        'description' => 'A test gallery description',
    ]);

    $response = test()->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/show')
        ->has('gallery')
        ->where('gallery.title', 'Test Gallery')
        ->where('gallery.slug', 'test-gallery')
        ->where('gallery.description', 'A test gallery description')
        ->has('gallery.images')
        ->has('gallery.created_at')
        ->has('gallery.updated_at')
    );
});

test('cannot display draft gallery show page', function () {
    $gallery = Gallery::factory()->draft()->create([
        'title' => 'Draft Gallery',
        'slug' => 'draft-gallery',
    ]);

    $response = test()->get("/galleries/{$gallery->slug}");

    $response->assertNotFound();
});

test('returns 404 for non-existent gallery', function () {
    $response = test()->get('/galleries/non-existent-gallery');

    $response->assertNotFound();
});

test('gallery show page displays correct image paths', function () {
    $gallery = Gallery::factory()->published()->create([
        'title' => 'Gallery with Images',
        'slug' => 'gallery-with-images',
        'attachments' => [
            'gallery-images/image1.jpg',
            'gallery-images/image2.png',
            'gallery-images/image3.webp',
        ],
    ]);

    $response = test()->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/show')
        ->has('gallery.images', 3)
        ->where('gallery.images.0', '/storage/gallery-images/image1.jpg')
        ->where('gallery.images.1', '/storage/gallery-images/image2.png')
        ->where('gallery.images.2', '/storage/gallery-images/image3.webp')
    );
});

test('gallery show page handles empty images array', function () {
    $gallery = Gallery::factory()->published()->withoutImages()->create([
        'title' => 'Gallery without Images',
        'slug' => 'gallery-without-images',
    ]);

    $response = test()->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/show')
        ->has('gallery.images', 0)
    );
});

test('gallery show page handles null attachments', function () {
    $gallery = Gallery::factory()->published()->create([
        'title' => 'Gallery with Null Attachments',
        'slug' => 'gallery-null-attachments',
        'attachments' => null,
    ]);

    $response = test()->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('galleries/show')
        ->has('gallery.images', 0)
    );
});
