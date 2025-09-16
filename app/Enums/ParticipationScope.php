<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum ParticipationScope: string implements HasColor, HasIcon, HasLabel
{
    case OPEN_FOR_ALL = 'open_for_all';
    case ONLY_GIRLS = 'only_girls';
    case JUNIOR_PROGRAMMERS = 'junior_programmers';
    case SELECTED_PERSONS = 'selected_persons';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::OPEN_FOR_ALL => 'Open for All',
            self::ONLY_GIRLS => 'Only Girls',
            self::JUNIOR_PROGRAMMERS => 'Junior Programmers',
            self::SELECTED_PERSONS => 'Selected Persons',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::OPEN_FOR_ALL => 'success',
            self::ONLY_GIRLS => 'pink',
            self::JUNIOR_PROGRAMMERS => 'info',
            self::SELECTED_PERSONS => 'warning',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::OPEN_FOR_ALL => 'heroicon-m-globe-alt',
            self::ONLY_GIRLS => 'heroicon-m-user-group',
            self::JUNIOR_PROGRAMMERS => 'heroicon-m-academic-cap',
            self::SELECTED_PERSONS => 'heroicon-m-users',
        };
    }
}
