<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;

class BlogPostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $blogPosts = BlogPost::published()
            ->select('id', 'title', 'slug', 'published_at', 'user_id')
            ->with(['media' => fn ($query) => $query->where('collection_name', 'featured_image')->limit(1), 'author:id,name'])
            ->orderBy('published_at', 'desc')
            ->paginate(10);

        return BlogPostResource::collection($blogPosts);
    }

    /**
     * Display the specified resource.
     */
    public function show(BlogPost $blogPost)
    {
        if ($blogPost->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            abort(404);
        }
        $blogPost->load(['media' => fn ($query) => $query->where('collection_name', 'featured_image'), 'author:id,name']);

        return new BlogPostResource($blogPost);
    }
}
