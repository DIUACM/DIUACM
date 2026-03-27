<?php

namespace App\Models;

use Database\Factories\EventUserStatFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventUserStat extends Model
{
    /** @use HasFactory<EventUserStatFactory> */
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'solve_count',
        'upsolve_count',
        'participation',
    ];

    protected function casts(): array
    {
        return [
            'event_id' => 'integer',
            'user_id' => 'integer',
            'solve_count' => 'integer',
            'upsolve_count' => 'integer',
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
