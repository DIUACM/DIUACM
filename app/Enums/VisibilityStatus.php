<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum VisibilityStatus: string implements HasColor, HasIcon, HasLabel
{
    case PUBLIC = 'public';
    case DRAFT = 'draft';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::PUBLIC => 'Public',
            self::DRAFT => 'Draft',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::PUBLIC => 'success',
            self::DRAFT => 'warning',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::PUBLIC => 'heroicon-m-eye',
            self::DRAFT => 'heroicon-m-document-text',
        };
    }
}
