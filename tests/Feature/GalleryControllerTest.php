<?php

<?php

use App\Enums\VisibilityStatus;
use App\Models\Gallery;
use Illuminate\Support\Facades\Storage;

it('displays published galleries with s3 urls on index page', function () {
    // Create published galleries
    $publishedGallery = Gallery::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'attachments' => ['images/test1.jpg', 'images/test2.jpg'],
    ]);

    // Create unpublished gallery (should not appear)
    Gallery::factory()->create([
        'status' => VisibilityStatus::DRAFT,
        'attachments' => ['images/draft.jpg'],
    ]);

    Storage::fake('s3');

    $response = $this->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('galleries/index')
        ->has('galleries', 1)
        ->where('galleries.0.id', $publishedGallery->id)
        ->where('galleries.0.title', $publishedGallery->title)
        ->where('galleries.0.images_count', 2)
        ->where('galleries.0.cover_image', Storage::disk('s3')->url('images/test1.jpg'))
    );
});

it('displays gallery details with s3 urls on show page', function () {
    $gallery = Gallery::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'attachments' => ['images/photo1.jpg', 'images/photo2.jpg'],
    ]);

    Storage::fake('s3');

    $response = $this->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('galleries/show')
        ->where('gallery.id', $gallery->id)
        ->where('gallery.title', $gallery->title)
        ->where('gallery.images.0', Storage::disk('s3')->url('images/photo1.jpg'))
        ->where('gallery.images.1', Storage::disk('s3')->url('images/photo2.jpg'))
    );
});

it('returns 404 for unpublished galleries', function () {
    $unpublishedGallery = Gallery::factory()->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get("/galleries/{$unpublishedGallery->slug}");

    $response->assertNotFound();
});

it('handles galleries with no attachments', function () {
    $gallery = Gallery::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'attachments' => null,
    ]);

    $response = $this->get('/galleries');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('galleries.0.images_count', 0)
        ->where('galleries.0.cover_image', null)
    );
});

it('handles galleries with empty attachments array', function () {
    $gallery = Gallery::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'attachments' => [],
    ]);

    $response = $this->get("/galleries/{$gallery->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('gallery.images', [])
    );
});
