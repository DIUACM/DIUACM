<?php

namespace App\Models;

use App\Enums\Gender;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class User extends Authenticatable implements FilamentUser, HasMedia, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory,Notifiable;

    use InteractsWithMedia;

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->email === 'sourov2305101004@diu.edu.bd' && $this->hasVerifiedEmail();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'gender',
        'phone',
        'codeforces_handle',
        'atcoder_handle',
        'vjudge_handle',
        'department',
        'student_id',
        'max_cf_rating',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'max_cf_rating' => 'integer',
            'gender' => Gender::class,
        ];
    }

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('profile_picture')
            ->useFallbackUrl(url: asset('images/fallback-gallery-image.jpeg'))
            ->singleFile()
            ->useDisk(diskName: 'media')
            ->registerMediaConversions(function (?Media $media = null) {
                $this
                    ->addMediaConversion('thumb')
                    ->fit(Fit::Contain, 300, 300)
                    ->queued();
            });
    }

    public function rankLists()
    {
        return $this->belongsToMany(RankList::class, 'rank_list_user')
            ->withPivot('score');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_member');
    }

    public function attendedEvents()
    {
        return $this->belongsToMany(Event::class, 'event_attendance')->withTimestamps();
    }

    public function eventUserStats()
    {
        return $this->hasMany(EventUserStat::class);
    }

    public function eventsWithStats()
    {
        return $this->belongsToMany(Event::class, 'event_user_stats')
            ->withPivot(['solve_count', 'upsolve_count', 'participation'])
            ->withTimestamps();
    }

    /**
     * Scope a query to search users by various fields.
     */
    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%")
                ->orWhere('student_id', 'like', "%{$search}%")
                ->orWhere('department', 'like', "%{$search}%")
                ->orWhere('codeforces_handle', 'like', "%{$search}%")
                ->orWhere('atcoder_handle', 'like', "%{$search}%")
                ->orWhere('vjudge_handle', 'like', "%{$search}%");
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'username';
    }
}
