<?php

namespace App\Models;

use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfsManualTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\MfsManualTransactionFactory> */
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'status',
        'sender_number',
        'mfs_transaction_id',
        'mfs_type',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'status' => MfsTransactionStatus::class,
            'mfs_type' => MfsType::class,
            'amount' => 'decimal:2',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
