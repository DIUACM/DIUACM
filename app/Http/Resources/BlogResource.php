<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Generate excerpt from content (strip HTML and limit to 200 characters)
        $excerpt = strip_tags($this->content);
        $excerpt = mb_strlen($excerpt) > 200
            ? mb_substr($excerpt, 0, 200).'...'
            : $excerpt;

        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $excerpt,
            'published_at' => $this->published_at?->format('M d, Y'),
            'is_featured' => $this->is_featured,
            'featured_image' => $this->getFirstMediaUrl('featured_image'),
            'author' => (new PublicUserResource($this->author))->toArray($request),
        ];
    }
}
