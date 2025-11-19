<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternalContestRegistration extends Model
{
    /** @use HasFactory<\Database\Factories\InternalContestRegistrationFactory> */
    use HasFactory;

    protected $fillable = [
        'internal_contest_id',
        'user_id',
        'name',
        'email',
        'student_id',
        'phone',
        'section',
        'department',
        'lab_teacher_name',
        'tshirt_size',
        'gender',
        'transport_service_required',
        'pickup_point',
        'payment_status',
    ];

    protected function casts(): array
    {
        return [
            'transport_service_required' => 'boolean',
            'gender' => Gender::class,
            'payment_status' => PaymentStatus::class,
        ];
    }

    public function internalContest()
    {
        return $this->belongsTo(InternalContest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
