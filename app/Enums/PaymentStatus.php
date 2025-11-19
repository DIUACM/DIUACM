<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum PaymentStatus: string implements HasColor, HasIcon, HasLabel
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case FAILED = 'failed';
    case CANCELED = 'canceled';
    case REFUNDED = 'refunded';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::PAID => 'Paid',
            self::FAILED => 'Failed',
            self::CANCELED => 'Canceled',
            self::REFUNDED => 'Refunded',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::PAID => 'success',
            self::FAILED => 'danger',
            self::CANCELED => 'gray',
            self::REFUNDED => 'info',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::PENDING => 'heroicon-m-clock',
            self::PAID => 'heroicon-m-check-circle',
            self::FAILED => 'heroicon-m-x-circle',
            self::CANCELED => 'heroicon-m-no-symbol',
            self::REFUNDED => 'heroicon-m-arrow-uturn-left',
        };
    }
}
