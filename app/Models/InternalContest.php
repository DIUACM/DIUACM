<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Database\Factories\InternalContestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class InternalContest extends Model implements HasMedia
{
    /** @use HasFactory<InternalContestFactory> */
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
        'sslcommerz_enabled',
        'bkash_enabled',
        'bkash_receiver_number',
        'bkash_instruction',
        'rocket_enabled',
        'rocket_receiver_number',
        'rocket_instruction',
        'nagad_enabled',
        'nagad_receiver_number',
        'nagad_instruction',
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
            'sslcommerz_enabled' => 'boolean',
            'bkash_enabled' => 'boolean',
            'rocket_enabled' => 'boolean',
            'nagad_enabled' => 'boolean',
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
        return $this->registrationStatus() === 'open';
    }

    public function registrationStatus(): string
    {
        if ($this->status !== VisibilityStatus::PUBLISHED) {
            return 'closed';
        }

        if (! $this->registration_start_time || ! $this->registration_deadline) {
            return 'closed';
        }

        if ($this->registration_start_time->isFuture()) {
            return 'upcoming';
        }

        if ($this->registration_deadline->isPast()) {
            return 'closed';
        }

        return 'open';
    }

    public function registrationUnavailableMessage(): string
    {
        return match ($this->registrationStatus()) {
            'upcoming' => 'Registration has not opened for this contest yet.',
            default => 'Registration is closed for this contest.',
        };
    }
}
