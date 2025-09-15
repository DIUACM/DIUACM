<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum ContestType: string implements HasColor, HasIcon, HasLabel
{
    case ICPCRegional = 'icpc_regional';
    case ICPCAsiaWest = 'icpc_asia_west';
    case IUPC = 'iupc';
    case Other = 'other';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::ICPCRegional => 'ICPC Regional',
            self::ICPCAsiaWest => 'ICPC Asia West',
            self::IUPC => 'IUPC',
            self::Other => 'Other',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::ICPCRegional => 'primary',
            self::ICPCAsiaWest => 'info',
            self::IUPC => 'success',
            self::Other => 'gray',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::ICPCRegional => 'heroicon-m-globe-alt',
            self::ICPCAsiaWest => 'heroicon-m-map',
            self::IUPC => 'heroicon-m-users',
            self::Other => 'heroicon-m-ellipsis-horizontal-circle',
        };
    }
}
