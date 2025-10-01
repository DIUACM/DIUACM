<?php

use App\Enums\VisibilityStatus;
use App\Models\BlogPost;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('can display the blog index page', function () {
    $response = $this->get('/blog');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/index'));
});

it('displays published blog posts on index page', function () {
    $publishedPost = BlogPost::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $draftPost = BlogPost::factory()->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get('/blog');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/index')
        ->has('blogPosts.data', 1)
        ->where('blogPosts.data.0.id', $publishedPost->id)
    );
});

it('can search blog posts', function () {
    $firstPost = BlogPost::factory()->create([
        'title' => 'Laravel Testing Guide',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $secondPost = BlogPost::factory()->create([
        'title' => 'React Best Practices',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subHour(),
    ]);

    $response = $this->get('/blog?search=Laravel');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/index')
        ->has('blogPosts.data', 1)
        ->where('blogPosts.data.0.id', $firstPost->id)
    );
});

it('can display a published blog post', function () {
    $blogPost = BlogPost::factory()->create([
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $response = $this->get("/blog/{$blogPost->slug}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/show')
        ->where('blogPost.id', $blogPost->id)
        ->where('blogPost.title', $blogPost->title)
    );
});

it('returns 404 for draft blog posts', function () {
    $draftPost = BlogPost::factory()->create([
        'status' => VisibilityStatus::DRAFT,
    ]);

    $response = $this->get("/blog/{$draftPost->slug}");

    $response->assertNotFound();
});

it('returns 404 for non-existent blog posts', function () {
    $response = $this->get('/blog/non-existent-post');

    $response->assertNotFound();
});

it('paginates blog posts correctly', function () {
    BlogPost::factory(15)->create([
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $response = $this->get('/blog');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/index')
        ->has('blogPosts.data', 12) // 12 per page as configured in controller
        ->where('blogPosts.total', 15)
        ->where('blogPosts.current_page', 1)
    );
});

it('includes author information in blog post data', function () {
    $author = User::factory()->create(['name' => 'John Doe']);
    $blogPost = BlogPost::factory()->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $response = $this->get('/blog');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('blog/index')
        ->where('blogPosts.data.0.author.name', 'John Doe')
    );
});
