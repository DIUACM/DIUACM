<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class InternalContest extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\InternalContestFactory> */
    use HasFactory;

    use InteractsWithMedia;

    protected $fillable = [
        'title',
        'slug',
        'semester',
        'description',
        'registration_deadline',
        'registration_start_time',
        'registration_limit',
        'registration_fee',
        'student_id_rules',
        'student_id_rules_guide',
        'pickup_points',
        'departments',
        'sections',
        'lab_teacher_names',
        'tshirt_sizes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => VisibilityStatus::class,
            'registration_deadline' => 'datetime',
            'registration_start_time' => 'datetime',
            'registration_limit' => 'integer',
            'registration_fee' => 'decimal:2',
            'pickup_points' => 'array',
            'departments' => 'array',
            'sections' => 'array',
            'lab_teacher_names' => 'array',
            'tshirt_sizes' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function registrations()
    {
        return $this->hasMany(InternalContestRegistration::class);
    }

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('banner_image')
            ->useFallbackUrl(url: asset('images/diuacm.jpeg'))
            ->singleFile()
            ->useDisk(diskName: 'media')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('banner')
                    ->fit(Fit::Contain, 1000, 700)
                    ->nonQueued();
            });

        $this
            ->addMediaCollection('tshirt_size_guideline')
            ->singleFile()
            ->useDisk(diskName: 'media');
    }

    public function isRegistrationOpen(): bool
    {
        $now = now();

        return $this->status === VisibilityStatus::PUBLISHED
            && $this->registration_start_time <= $now
            && $this->registration_deadline >= $now;
    }
}
