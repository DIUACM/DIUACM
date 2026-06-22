<?php

namespace App\Models;

use App\Enums\Gender;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser, HasMedia, MustVerifyEmail
{
    public const BANNED_RANKLIST_POSITION = 99999;

    public const BANNED_RANKLIST_SCORE = -1;

    /** @use HasFactory<UserFactory> */
    use HasFactory,Notifiable;

    use HasRoles;
    use InteractsWithMedia;

    public function canAccessPanel(Panel $panel): bool
    {
        return ! $this->is_banned && $this->hasVerifiedEmail() && $this->roles()->count() > 0;
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
        'is_banned',
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
            'is_banned' => 'boolean',
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
            ->using(RankListUser::class)
            ->withPivot('score', 'position');
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

    public function jobExperiences()
    {
        return $this->hasMany(JobExperience::class);
    }

    /**
     * Scope a query to only programmers (users with at least one programming handle).
     */
    public function scopeHasProgrammingHandle($query)
    {
        return $query->where(function ($q) {
            $q->where('codeforces_handle', '!=', '')
                ->orWhere('atcoder_handle', '!=', '')
                ->orWhere('vjudge_handle', '!=', '');
        });
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

    /**
     * Get the cached avatar URL for the user.
     */
    public function getAvatarUrlAttribute(): string
    {
        return cache()->remember(
            key: "user.{$this->id}.avatar",
            ttl: now()->addDay(),
            callback: fn () => $this->getFirstMediaUrl('profile_picture')
        );
    }

    /**
     * Clear avatar cache when user is updated.
     */
    protected static function booted(): void
    {
        static::updated(function (User $user) {
            cache()->forget("user.{$user->id}.avatar");

            if ($user->wasChanged('is_banned') && $user->is_banned) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
                DB::table('users')->where('id', $user->id)->update(['remember_token' => null]);
                DB::table('rank_list_user')->where('user_id', $user->id)->update([
                    'score' => self::BANNED_RANKLIST_SCORE,
                    'position' => self::BANNED_RANKLIST_POSITION,
                ]);
            }

            if ($user->wasChanged('is_banned')) {
                Cache::add('tracker.show.version', 1, now()->addYear());
                Cache::increment('tracker.show.version');
            }
        });

        static::deleted(function (User $user) {
            cache()->forget("user.{$user->id}.avatar");
        });
    }
}
