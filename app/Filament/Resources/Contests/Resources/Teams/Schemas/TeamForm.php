<?php

namespace App\Filament\Resources\Contests\Resources\Teams\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Select;

class TeamForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('rank')
                    ->numeric(),
                TextInput::make('solve_count')
                    ->numeric(),
                Select::make('members')
                    ->relationship('members', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable(),
            ]);
    }
}
