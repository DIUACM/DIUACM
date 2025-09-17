<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventUserStat extends Model
{
    /** @use HasFactory<\Database\Factories\EventUserStatFactory> */
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'solves_count',
        'upsolves_count',
        'participation',
    ];

    protected function casts(): array
    {
        return [
            'solves_count' => 'integer',
            'upsolves_count' => 'integer',
            'participation' => 'boolean',
        ];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
