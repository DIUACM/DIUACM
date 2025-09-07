<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\Schemas;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class RankListForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('keyword')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('weight_of_upsolve')
                    ->required()
                    ->numeric()
                    ->default(0.25),
                Select::make('status')
                    ->options(VisibilityStatus::class)
                    ->default('draft')
                    ->required(),
                TextInput::make('order')
                    ->required()
                    ->numeric()
                    ->default(0),
                Toggle::make('is_active')
                    ->required(),
                Toggle::make('consider_strict_attendance')
                    ->required(),
            ]);
    }
}
