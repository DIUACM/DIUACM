<?php

namespace App\Filament\Resources\Contests\Schemas;

use App\Enums\ContestType;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class ContestForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('gallery_id')
                    ->numeric(),
                Select::make('contest_type')
                    ->options(ContestType::class)
                    ->required(),
                TextInput::make('location'),
                DateTimePicker::make('date'),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('standings_url')
                    ->url(),
            ]);
    }
}
