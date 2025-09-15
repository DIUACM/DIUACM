<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $fillable = [
        'title',
        'description',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
        ];
    }
}
