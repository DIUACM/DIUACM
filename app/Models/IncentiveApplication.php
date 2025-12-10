<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncentiveApplication extends Model
{
    /** @use HasFactory<\Database\Factories\IncentiveApplicationFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'student_id',
        'batch',
        'email',
        'current_semester',
        'phone_number',
        'courses',
    ];

    protected function casts(): array
    {
        return [
            'courses' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
