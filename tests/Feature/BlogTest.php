<?php

use App\Models\BlogPost;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('shows published blogs on index and hides drafts', function () {
    $published = BlogPost::factory()->count(2)->published()->create();
    $draft = BlogPost::factory()->count(2)->draft()->create();

    $response = get('/blogs');

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page->component('blog/index')
        ->where('blogs', fn ($blogs) => collect($blogs)->every(fn ($b) => in_array($b['id'], $published->pluck('id')->all()))
            && collect($blogs)->doesntContain(fn ($b) => in_array($b['id'], $draft->pluck('id')->all()))
        )
    );
});

it('returns 404 for draft blog show', function () {
    $draft = BlogPost::factory()->draft()->create(['slug' => 'draft-post']);
    get('/blogs/'.$draft->slug)->assertNotFound();
});

it('shows published blog details', function () {
    $post = BlogPost::factory()->published()->create(['slug' => 'my-post']);

    $response = get('/blogs/'.$post->slug);
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page->component('blog/show')
        ->where('blog.title', $post->title)
        ->where('blog.slug', $post->slug)
    );
});
