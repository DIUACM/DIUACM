<?php

namespace App\Http\Controllers;

use App\Http\Resources\BlogDetailsResource;
use App\Http\Resources\BlogResource;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Display a paginated list of published blog posts.
     */
    public function index(Request $request): Response
    {
        $blogPosts = BlogPost::query()
            ->select([
                'id',
                'title',
                'slug',
                'user_id',
                'content',
                'published_at',
                'is_featured',
                'updated_at',
            ])
            ->with(['author:id,name,username,updated_at'])
            ->published()
            ->when($request->get('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->orderBy('published_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('blog/index', [
            'blogPosts' => BlogResource::collection($blogPosts),
            'filters' => [
                'search' => $request->get('search'),
            ],
        ]);
    }

    /**
     * Display the specified blog post.
     */
    public function show(BlogPost $blogPost): Response
    {
        // Only show published posts
        abort_if($blogPost->status->value !== 'published', 404, 'Blog post not found.');

        // Load author and media
        $blogPost->load([
            'author:id,name,username,updated_at',
            'media',
        ]);

        return Inertia::render('blog/show', [
            'blogPost' => BlogDetailsResource::make($blogPost)->resolve(),
        ]);
    }
}
