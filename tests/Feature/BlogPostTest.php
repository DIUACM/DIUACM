<?php

use App\Enums\VisibilityStatus;
use App\Models\BlogPost;

test('can create a blog post', function () {
    $blogPost = BlogPost::factory()->create([
        'title' => 'Test Blog Post',
        'slug' => 'test-blog-post',
        'author' => 'Test Author',
        'content' => 'This is test content for the blog post.',
        'status' => VisibilityStatus::DRAFT,
    ]);

    expect($blogPost)
        ->title->toBe('Test Blog Post')
        ->slug->toBe('test-blog-post')
        ->author->toBe('Test Author')
        ->status->toBe(VisibilityStatus::DRAFT);

    // Verify the blog post exists in the database
    expect(BlogPost::where('slug', 'test-blog-post')->first())
        ->not->toBeNull()
        ->title->toBe('Test Blog Post');
});

test('blog post uses slug as route key', function () {
    $blogPost = BlogPost::factory()->create(['slug' => 'test-slug']);

    expect($blogPost->getRouteKeyName())->toBe('slug');
});

test('can determine if blog post is published', function () {
    $draftPost = BlogPost::factory()->draft()->create();
    $publishedPost = BlogPost::factory()->published()->create([
        'published_at' => now()->subDay(),
    ]);
    $futurePost = BlogPost::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->addDay(),
    ]);

    expect($draftPost->isPublished())->toBeFalse();
    expect($publishedPost->isPublished())->toBeTrue();
    expect($futurePost->isPublished())->toBeFalse();
});

test('published scope works correctly', function () {
    BlogPost::factory()->draft()->create();
    BlogPost::factory()->published()->create(['published_at' => now()->subDay()]);
    BlogPost::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->addDay(),
    ]);

    $publishedPosts = BlogPost::published()->get();

    expect($publishedPosts)->toHaveCount(1);
});

test('featured scope works correctly', function () {
    BlogPost::factory()->create(['is_featured' => false]);
    BlogPost::factory()->featured()->create();
    BlogPost::factory()->featured()->create();

    $featuredPosts = BlogPost::featured()->get();

    expect($featuredPosts)->toHaveCount(2);
    expect($featuredPosts->every->is_featured)->toBeTrue();
});

test('blog post attributes are cast correctly', function () {
    $blogPost = BlogPost::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'is_featured' => true,
        'published_at' => '2024-01-01 12:00:00',
    ]);

    expect($blogPost->status)->toBeInstanceOf(VisibilityStatus::class);
    expect($blogPost->is_featured)->toBeTrue();
    expect($blogPost->published_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});
