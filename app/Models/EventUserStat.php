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
        'solve_count',
        'upsolve_count',
        'participation',
    ];

    protected function casts(): array
    {
        return [
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
