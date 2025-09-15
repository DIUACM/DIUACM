<?php

namespace App\Models;

use App\Enums\ContestType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'gallery_id',
        'contest_type',
        'location',
        'date',
        'description',
        'standings_url',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'contest_type' => ContestType::class,
        ];
    }

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    // A contest has many teams. Users are related to contests through teams pivot (team_user).
}
