<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum MfsTransactionStatus: string implements HasColor, HasIcon, HasLabel
{
    case PENDING = 'pending';
    case VERIFIED = 'verified';
    case INVALID = 'invalid';
    case REFUNDED = 'refunded';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::VERIFIED => 'Verified',
            self::INVALID => 'Invalid',
            self::REFUNDED => 'Refunded',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::VERIFIED => 'success',
            self::INVALID => 'danger',
            self::REFUNDED => 'info',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::PENDING => 'heroicon-o-clock',
            self::VERIFIED => 'heroicon-o-check-circle',
            self::INVALID => 'heroicon-o-x-circle',
            self::REFUNDED => 'heroicon-o-arrow-path',
        };
    }
}
