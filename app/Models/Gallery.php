<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Gallery extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\GalleryFactory> */
    use HasFactory;

    use InteractsWithMedia;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => VisibilityStatus::class,
        ];
    }

    public function scopePublished(Builder $query): void
    {
        $query->where('status', VisibilityStatus::PUBLISHED);
    }

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('gallery_images')
            ->useDisk(diskName: 'public')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('thumb')
                    ->fit(Fit::Contain, 500, 300)
                    ->queued();
            });
    }
}
