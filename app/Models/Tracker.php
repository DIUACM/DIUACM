<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tracker extends Model
{
    /** @use HasFactory<\Database\Factories\TrackerFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'status' => VisibilityStatus::class,
        ];
    }

    public function rankLists(): HasMany
    {
        return $this->hasMany(RankList::class);
    }

    /**
     * Scope a query to only include published trackers.
     */
    public function scopePublished($query)
    {
        return $query->where('status', VisibilityStatus::PUBLISHED);
    }

    /**
     * Scope a query to search trackers by title or description.
     */
    public function scopeSearch($query, ?string $searchTerm)
    {
        if (empty($searchTerm)) {
            return $query;
        }

        return $query->where(function ($q) use ($searchTerm) {
            $q->where('title', 'like', '%'.$searchTerm.'%')
                ->orWhere('description', 'like', '%'.$searchTerm.'%');
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
