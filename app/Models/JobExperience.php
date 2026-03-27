<?php

namespace App\Models;

use Database\Factories\JobExperienceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class JobExperience extends Model implements HasMedia
{
    /** @use HasFactory<JobExperienceFactory> */
    use HasFactory;

    use InteractsWithMedia;

    protected $fillable = [
        'user_id',
        'company_name',
        'position',
        'description',
        'start_date',
        'end_date',
        'is_current',
        'location',
        'company_website',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('images')
            ->useDisk(diskName: 'media')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('thumb')
                    ->width(1000)
                    ->queued();
            });
    }

    /**
     * Get the formatted duration of the job experience.
     */
    public function getDurationAttribute(): string
    {
        $start = $this->start_date->format('M Y');
        $end = $this->is_current ? 'Present' : $this->end_date?->format('M Y');

        return "{$start} - {$end}";
    }

    /**
     * Scope a query to order by most recent first.
     */
    public function scopeRecent($query)
    {
        return $query->orderByRaw('is_current DESC, start_date DESC');
    }
}
