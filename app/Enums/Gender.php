<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum Gender: string implements HasColor, HasIcon, HasLabel
{
    case MALE = 'male';
    case FEMALE = 'female';
    case OTHER = 'other';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::MALE => 'Male',
            self::FEMALE => 'Female',
            self::OTHER => 'Other',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::MALE => 'success',
            self::FEMALE => 'warning',
            self::OTHER => 'danger',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::MALE => 'heroicon-m-check-circle',
            self::FEMALE => 'heroicon-m-clock',
            self::OTHER => 'heroicon-m-x-circle',
        };
    }
}
