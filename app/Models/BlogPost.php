<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\RichEditor\FileAttachmentProviders\SpatieMediaLibraryFileAttachmentProvider;
use Filament\Forms\Components\RichEditor\Models\Concerns\InteractsWithRichContent;
use Filament\Forms\Components\RichEditor\Models\Contracts\HasRichContent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BlogPost extends Model implements HasMedia, HasRichContent
{
    /** @use HasFactory<\Database\Factories\BlogPostFactory> */
    use HasFactory;

    use InteractsWithMedia;
    use InteractsWithRichContent;

    protected $fillable = [
        'title',
        'slug',
        'user_id',
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

    public function setUpRichContent(): void
    {
        $this->registerRichContent('content')
            ->fileAttachmentsVisibility('public')
            ->fileAttachmentsDisk('media')
            ->fileAttachmentProvider(
                SpatieMediaLibraryFileAttachmentProvider::make()

                    ->collection('content-file-attachments'),
            );
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
            ->useFallbackUrl(url: asset('images/fallback-gallery-image.jpeg'))
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
