<?php

namespace App\Filament\Resources\Contests\Resources\Teams\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TeamForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Team Information')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Team name'),

                        Grid::make()
                            ->schema([
                                TextInput::make('rank')
                                    ->numeric()
                                    ->minValue(1)
                                    ->maxValue(10000)
                                    ->step(1)
                                    ->helperText('Final standing / placement'),

                                TextInput::make('solve_count')
                                    ->numeric()
                                    ->minValue(0)
                                    ->maxValue(1000)
                                    ->step(1)
                                    ->helperText('Number of problems solved'),
                            ]),

                        Select::make('members')
                            ->relationship('members', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->helperText('Select one or more team members'),
                    ]),

                Section::make('Metadata')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextEntry::make('created_at')
                                    ->label('Created')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                                TextEntry::make('updated_at')
                                    ->label('Last Updated')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                            ]),
                    ])
                    ->collapsed()
                    ->hiddenOn('create'),
            ]);
    }
}
