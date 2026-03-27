<?php

namespace App\Models;

use App\Enums\ContestType;
use Database\Factories\ContestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contest extends Model
{
    /** @use HasFactory<ContestFactory> */
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
            'gallery_id' => 'integer',
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
