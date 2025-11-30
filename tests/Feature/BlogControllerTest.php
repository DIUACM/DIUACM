<?php

use App\Enums\VisibilityStatus;
use App\Models\BlogPost;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('displays blog posts list page', function () {
    $author = User::factory()->create();
    BlogPost::factory()->count(3)->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->has('blogPosts.data', 3)
        );
});

it('can search blog posts by title', function () {
    $author = User::factory()->create();
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'Laravel Tips and Tricks',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'React Best Practices',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog?search=Laravel')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->has('blogPosts.data', 1)
                ->where('blogPosts.data.0.title', 'Laravel Tips and Tricks')
        );
});

it('can search blog posts by content', function () {
    $author = User::factory()->create();
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'My First Post',
        'content' => 'This is about competitive programming',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'My Second Post',
        'content' => 'This is about web development',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog?search=competitive')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->has('blogPosts.data', 1)
                ->where('blogPosts.data.0.title', 'My First Post')
        );
});

it('displays blog post details page', function () {
    $author = User::factory()->create([
        'name' => 'John Doe',
        'username' => 'johndoe',
    ]);
    $blogPost = BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'My Blog Post',
        'slug' => 'my-blog-post',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get("/blog/{$blogPost->slug}")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/show')
                ->where('blogPost.title', 'My Blog Post')
                ->where('blogPost.slug', 'my-blog-post')
                ->where('blogPost.author.name', 'John Doe')
                ->where('blogPost.author.username', 'johndoe')
        );
});

it('returns 404 for unpublished blog post', function () {
    $author = User::factory()->create();
    $blogPost = BlogPost::factory()->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::DRAFT,
    ]);

    get("/blog/{$blogPost->slug}")
        ->assertNotFound();
});

it('orders blog posts by published date descending', function () {
    $author = User::factory()->create();
    $oldPost = BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'Old Post',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDays(3),
    ]);
    $newPost = BlogPost::factory()->create([
        'user_id' => $author->id,
        'title' => 'New Post',
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->where('blogPosts.data.0.title', 'New Post')
                ->where('blogPosts.data.1.title', 'Old Post')
        );
});

it('only displays published blog posts', function () {
    $author = User::factory()->create();
    BlogPost::factory()->count(3)->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);
    BlogPost::factory()->count(2)->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::DRAFT,
    ]);

    get('/blog')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->has('blogPosts.data', 3)
        );
});

it('includes author information in blog post list', function () {
    $author = User::factory()->create([
        'name' => 'Jane Doe',
        'username' => 'janedoe',
    ]);
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->where('blogPosts.data.0.author.name', 'Jane Doe')
                ->where('blogPosts.data.0.author.username', 'janedoe')
        );
});

it('generates excerpt from content', function () {
    $author = User::factory()->create();
    $longContent = str_repeat('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ', 50);
    BlogPost::factory()->create([
        'user_id' => $author->id,
        'content' => $longContent,
        'status' => VisibilityStatus::PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    get('/blog')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('blog/index')
                ->has('blogPosts.data.0.excerpt')
        );
});
