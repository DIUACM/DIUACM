<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum MfsType: string implements HasColor, HasIcon, HasLabel
{
    case BKASH = 'bkash';
    case NAGAD = 'nagad';
    case ROCKET = 'rocket';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::BKASH => 'Bkash',
            self::NAGAD => 'Nagad',
            self::ROCKET => 'Rocket',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::BKASH => 'danger',
            self::NAGAD => 'warning',
            self::ROCKET => 'primary',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::BKASH => 'heroicon-o-device-phone-mobile',
            self::NAGAD => 'heroicon-o-device-phone-mobile',
            self::ROCKET => 'heroicon-o-device-phone-mobile',
        };
    }
}
