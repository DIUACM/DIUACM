<?php

namespace App\Models;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'status' => VisibilityStatus::class,
        ];
    }
}
