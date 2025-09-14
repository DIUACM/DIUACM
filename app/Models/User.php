<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

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
        'image',
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

    /**
     * Get the profile image URL for the user.
     */
    public function getImageUrlAttribute(): string
    {
        if (is_null($this->image)) {
            return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
        }

        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        return asset('storage/' . $this->image);
    }

    public function attendedEvents()
    {
        return $this->belongsToMany(Event::class, 'event_attendance')->withTimestamps();
    }

    public function rankLists()
    {
        return $this->belongsToMany(RankList::class, 'rank_list_user')
            ->withPivot('score');
    }

    public function eventUserStats()
    {
        return $this->hasMany(EventUserStat::class);
    }

    public function eventsWithStats()
    {
        return $this->belongsToMany(Event::class, 'event_user_stats')
            ->withPivot(['solves_count', 'upsolves_count', 'participation'])
            ->withTimestamps();
    }
}
