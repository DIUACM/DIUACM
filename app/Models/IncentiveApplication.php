<?php

namespace App\Models;

use Database\Factories\IncentiveApplicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncentiveApplication extends Model
{
    /** @use HasFactory<IncentiveApplicationFactory> */
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
            'user_id' => 'integer',
            'courses' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
