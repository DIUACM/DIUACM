<?php

namespace App\Models;

use App\Enums\ContestType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contest extends Model
{
    /** @use HasFactory<\Database\Factories\ContestFactory> */
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
}
