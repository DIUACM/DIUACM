<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RankList extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracker_id',
        'keyword',
        'description',
        'weight_of_upsolve',
        'status',
        'order',
        'is_active',
        'consider_strict_attendance',
    ];

    protected function casts(): array
    {
        return [
            'weight_of_upsolve' => 'float',
            'status' => VisibilityStatus::class,
            'is_active' => 'boolean',
            'consider_strict_attendance' => 'boolean',
        ];
    }

    public function tracker(): BelongsTo
    {
        return $this->belongsTo(Tracker::class);
    }
}
