<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'contest_id',
        'rank',
        'solve_count',
    ];

    protected function casts(): array
    {
        return [
            'contest_id' => 'integer',
            'rank' => 'integer',
            'solve_count' => 'integer',
        ];
    }

    public function contest()
    {
        return $this->belongsTo(Contest::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'team_member');
    }
}
