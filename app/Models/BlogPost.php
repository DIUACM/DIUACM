<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\VisibilityStatus;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BlogPost extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\BlogPostFactory> */
    use HasFactory;
    use InteractsWithMedia;



    protected $fillable = [
        'title',
        'slug',
        'author',
        'content',
        'status',
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
    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

     public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('featured_image')
            ->singleFile()
            ->useDisk(diskName: 'media')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('thumb')
                    ->fit(Fit::Contain, 300, 300)
                    ->nonQueued();
            });
    }

}
