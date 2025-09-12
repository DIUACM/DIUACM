<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;

enum VisibilityStatus: string implements HasColor, HasIcon, HasLabel
{
    case PUBLISHED = 'published';
    case DRAFT = 'draft';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::PUBLISHED => 'Published',
            self::DRAFT => 'Draft',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::PUBLISHED => 'success',
            self::DRAFT => 'warning',
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::PUBLISHED => 'heroicon-m-eye',
            self::DRAFT => 'heroicon-m-document-text',
        };
    }
}
