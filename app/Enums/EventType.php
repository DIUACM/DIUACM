<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum EventType: string implements HasColor, HasIcon, HasLabel
{
    case CONTEST = 'contest';
    case _CLASS = 'class';
    case OTHER = 'other';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::CONTEST => 'Contest',
            self::_CLASS => 'Class',
            self::OTHER => 'Other',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::CONTEST => 'danger',
            self::_CLASS => 'primary',
            self::OTHER => 'gray',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::CONTEST => 'heroicon-m-trophy',
            self::_CLASS => 'heroicon-m-book-open',
            self::OTHER => 'heroicon-m-ellipsis-horizontal-circle',
        };
    }
}
