<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RankListUser extends Pivot
{
    public $incrementing = false;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'score' => 'float',
            'position' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (RankListUser $rankListUser): void {
            if (User::query()->whereKey($rankListUser->user_id)->where('is_banned', true)->exists()) {
                $rankListUser->score = User::BANNED_RANKLIST_SCORE;
                $rankListUser->position = User::BANNED_RANKLIST_POSITION;
            }
        });
    }
}
