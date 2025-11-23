<?php

namespace App\Models;

use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use App\Enums\PaymentStatus;
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
        'receiver_number',
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

    protected static function booted(): void
    {
        static::updating(function (MfsManualTransaction $transaction) {
            if ($transaction->isDirty('status')) {
                $transaction->updatePaymentStatus();
            }
        });
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    protected function updatePaymentStatus(): void
    {
        $paymentStatus = match ($this->status) {
            MfsTransactionStatus::VERIFIED => PaymentStatus::PAID,
            MfsTransactionStatus::INVALID => PaymentStatus::FAILED,
            MfsTransactionStatus::REFUNDED => PaymentStatus::REFUNDED,
            MfsTransactionStatus::PENDING => PaymentStatus::UNDER_MANUAL_REVIEW,
        };

        $this->payment->update(['status' => $paymentStatus]);
    }
}
