<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('blog-posts.index')) {
            return [
                'title' => $this->title,
                'slug' => $this->slug,
                'published_at' => $this->published_at?->toISOString(),
                'author' => $this->author->name,
                'featured_image' => $this->getFirstMediaUrl('featured_image'), // will return fallback if no image
            ];
        }

        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'published_at' => $this->published_at?->toISOString(),
            'is_featured' => $this->is_featured,
            'author' => $this->author->name,
            'featured_image' => $this->getFirstMediaUrl('featured_image'), // will return fallback if no image
        ];
    }
}
