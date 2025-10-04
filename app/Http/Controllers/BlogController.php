<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RalphJSmit\Laravel\SEO\Support\SEOData;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = 12;

        $query = BlogPost::query()
            ->with(['author', 'media'])
            ->published()
            ->latest('published_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $blogPosts = $query->paginate($perPage);

        $blogPosts->getCollection()->transform(function ($post) {
            return [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $this->generateExcerpt($post->content),
                'author' => [
                    'name' => $post->author->name,
                    'username' => $post->author->username,
                ],
                'published_at' => $post->published_at->format('M j, Y'),
                'is_featured' => $post->is_featured,
                'featured_image_url' => $post->getFirstMediaUrl('featured_image', 'thumb') ?: null,
                'reading_time' => $this->estimateReadingTime($post->content),
            ];
        });

        $seoDescription = $search
            ? "Search results for '{$search}' in our blog. Discover articles, tutorials, and insights from the DIU ACM community."
            : 'Explore our blog for competitive programming tips, tutorials, contest insights, and community stories from DIU ACM.';

        return Inertia::render('blog/index', [
            'blogPosts' => $blogPosts,
            'filters' => [
                'search' => $search,
            ],
        ])->withViewData([
            'SEOData' => new SEOData(
                title: $search ? "Search: {$search}" : 'Blog',
                description: $seoDescription,
            ),
        ]);
    }

    public function show(BlogPost $blogPost)
    {
        // Check if the blog post is published
        if ($blogPost->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $blogPost->load(['author', 'media']);

        return Inertia::render('blog/show', [
            'blogPost' => [
                'id' => $blogPost->id,
                'title' => $blogPost->title,
                'slug' => $blogPost->slug,
                'content' => $blogPost->content,
                'author' => [
                    'name' => $blogPost->author->name,
                    'username' => $blogPost->author->username,
                ],
                'published_at' => $blogPost->published_at->format('M j, Y'),
                'is_featured' => $blogPost->is_featured,
                'featured_image_url' => $blogPost->getFirstMediaUrl('featured_image') ?: null,
                'reading_time' => $this->estimateReadingTime($blogPost->content),
            ],
        ])->withViewData([
            'SEOData' => new SEOData(
                title: $blogPost->title,
                description: $this->generateExcerpt($blogPost->content, 160),
                image: $blogPost->getFirstMediaUrl('featured_image') ?: null,
            ),
        ]);
    }

    private function generateExcerpt(string $content, int $length = 150): string
    {
        $text = strip_tags($content);
        if (strlen($text) <= $length) {
            return $text;
        }

        return substr($text, 0, $length).'...';
    }

    private function estimateReadingTime(string $content): int
    {
        $wordCount = str_word_count(strip_tags($content));
        $wordsPerMinute = 200; // Average reading speed

        return max(1, round($wordCount / $wordsPerMinute));
    }
}
