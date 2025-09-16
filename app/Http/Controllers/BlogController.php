<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = 9;

        $query = BlogPost::query()
            ->published()
            ->when($validated['title'] ?? null, function ($q, $title) {
                $q->where('title', 'like', "%{$title}%");
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage)->withQueryString();

        $items = collect($paginator->items())->map(function (BlogPost $post) {
            return [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'author' => $post->author,
                'content' => $post->content,
                'featured_image' => $post->featured_image ? Storage::disk('s3')->url($post->featured_image) : null,
                'published_at' => $post->published_at,
            ];
        })->all();

        return Inertia::render('blog/Index', [
            'blogs' => $items,
            'pagination' => [
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'limit' => $paginator->perPage(),
            ],
            'filters' => [
                'title' => $validated['title'] ?? null,
            ],
        ])->withViewData([
            'title' => ($validated['title'] ?? null) ? "Blog: {$validated['title']}" : 'Blog',
        ]);
    }

    public function show(BlogPost $blog): Response
    {
        if ($blog->status !== VisibilityStatus::PUBLISHED || ! $blog->published_at || ! $blog->published_at->isPast()) {
            abort(404);
        }

        return Inertia::render('blog/Show', [
            'blog' => [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'author' => $blog->author,
                'content' => $blog->content,
                'featured_image' => $blog->featured_image ? Storage::disk('s3')->url($blog->featured_image) : null,
                'published_at' => $blog->published_at,
            ],
        ])->withViewData([
            'title' => $blog->title,
            'description' => str($blog->content)->limit(160)->toString(),
        ]);
    }
}
