<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'author',
        'content',
        'status',
        'featured_image',
        'published_at',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_featured' => 'boolean',
            'status' => VisibilityStatus::class,
        ];
    }

    /**
     * Check if the blog post is published.
     */
    public function isPublished(): bool
    {
        return $this->status === VisibilityStatus::PUBLISHED &&
               $this->published_at !== null &&
               $this->published_at->isPast();
    }

    /**
     * Scope to get only published blog posts.
     */
    public function scopePublished($query)
    {
        return $query->where('status', VisibilityStatus::PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Scope to get featured blog posts.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
