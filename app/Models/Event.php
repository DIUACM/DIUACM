<?php

namespace App\Models;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Event extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\EventFactory> */
    use HasFactory;

    use InteractsWithMedia;

    protected $fillable = [
        'title',
        'description',
        'status',
        'starting_at',
        'ending_at',
        'event_link',
        'event_password',
        'open_for_attendance',
        'strict_attendance',
        'type',
        'participation_scope',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'event_password',
    ];

    protected function casts(): array
    {
        return [
            'starting_at' => 'datetime',
            'ending_at' => 'datetime',
            'open_for_attendance' => 'boolean',
            'strict_attendance' => 'boolean',
            'type' => EventType::class,
            'participation_scope' => ParticipationScope::class,
            'status' => VisibilityStatus::class,
        ];
    }

    /**
     * Determine if the attendance window is currently enabled for the event.
     *
     * The window opens 15 minutes before `starting_at` and closes 20 minutes after `ending_at`.
     */
    public function isAttendanceWindowEnabled(): bool
    {
        if (! $this->open_for_attendance) {
            return false;
        }

        if ($this->starting_at === null || $this->ending_at === null) {
            return false;
        }

        $windowStart = $this->starting_at->copy()->subMinutes(15);
        $windowEnd = $this->ending_at->copy()->addMinutes(20);

        return now()->between($windowStart, $windowEnd, true);
    }

    /**
     * Scope a query to only include published events.
     */
    public function scopePublished($query)
    {
        return $query->where('status', VisibilityStatus::PUBLISHED);
    }

    /**
     * Scope a query to search events by title, description, or event link.
     */
    public function scopeSearch($query, ?string $searchTerm)
    {
        if (empty($searchTerm)) {
            return $query;
        }

        return $query->where(function ($q) use ($searchTerm) {
            $q->where('title', 'like', '%'.$searchTerm.'%')
                ->orWhere('description', 'like', '%'.$searchTerm.'%')
                ->orWhere('event_link', 'like', '%'.$searchTerm.'%');
        });
    }

    /**
     * Scope a query to filter events by type.
     */
    public function scopeOfType($query, ?string $type)
    {
        if (empty($type)) {
            return $query;
        }

        return $query->where('type', $type);
    }

    /**
     * Scope a query to filter events by participation scope.
     */
    public function scopeForParticipationScope($query, ?string $participationScope)
    {
        if (empty($participationScope)) {
            return $query;
        }

        return $query->where('participation_scope', $participationScope);
    }

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_attendance')->withTimestamps();
    }

    public function rankLists()
    {
        return $this->belongsToMany(RankList::class, 'event_rank_list')
            ->withPivot('weight');
    }

    public function eventUserStats()
    {
        return $this->hasMany(EventUserStat::class);
    }

    public function usersWithStats()
    {
        return $this->belongsToMany(User::class, 'event_user_stats')
            ->withPivot(['solve_count', 'upsolve_count', 'participation'])
            ->withTimestamps();
    }

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('event_images')
            ->useDisk(diskName: 'media')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('thumb')
                    ->width(1000)
                    ->queued();
            });
    }
}
