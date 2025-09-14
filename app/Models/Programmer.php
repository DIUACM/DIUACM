<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Programmer extends Model
{
    /** @use HasFactory<\Database\Factories\ProgrammerFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
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
        'bio',
        'skills',
        'experience_years',
        'github_handle',
        'linkedin_handle',
        'website',
        'location',
        'is_available_for_hire',
        'hourly_rate',
        'preferred_languages',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'max_cf_rating' => 'integer',
            'gender' => Gender::class,
            'skills' => 'array',
            'experience_years' => 'integer',
            'is_available_for_hire' => 'boolean',
            'hourly_rate' => 'decimal:2',
            'preferred_languages' => 'array',
        ];
    }

    /**
     * Get the user associated with this programmer profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the events this programmer has attended.
     */
    public function attendedEvents()
    {
        return $this->belongsToMany(Event::class, 'event_attendance')->withTimestamps();
    }

    /**
     * Get the rank lists this programmer is part of.
     */
    public function rankLists()
    {
        return $this->belongsToMany(RankList::class, 'rank_list_user')
            ->withPivot('score');
    }

    /**
     * Get the event user stats for this programmer.
     */
    public function eventUserStats()
    {
        return $this->hasMany(EventUserStat::class);
    }

    /**
     * Get the events with stats for this programmer.
     */
    public function eventsWithStats()
    {
        return $this->belongsToMany(Event::class, 'event_user_stats')
            ->withPivot(['solves_count', 'upsolves_count', 'participation'])
            ->withTimestamps();
    }
}