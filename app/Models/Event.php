<?php

namespace App\Models;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

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

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_attendance')->withTimestamps();
    }
}
