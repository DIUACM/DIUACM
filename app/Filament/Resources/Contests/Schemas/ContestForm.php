<?php

namespace App\Filament\Resources\Contests\Schemas;

use App\Enums\ContestType;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ContestForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Contest Details')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('name')
                        ->unique(ignoreRecord: true)
                            ->required()
                            ->maxLength(255),

                        Select::make('gallery_id')
                            ->label('Gallery')
                            ->relationship('gallery', 'title')
                            ->searchable()
                            ->preload()
                            ->placeholder('Select a gallery')
                            ->helperText('Optional: Link this contest to a gallery of photos.')
                            ->columnSpan(1),

                        Select::make('contest_type')
                            ->options(ContestType::class)
                            ->required()
                            ->helperText('Select the type/category of this contest.')
                            ->columnSpan(1),

                        TextInput::make('location')
                            ->maxLength(255)
                            ->placeholder('e.g. Dhaka, Bangladesh')
                            ->columnSpan(1),

                        DateTimePicker::make('date')
                            ->seconds(false)
                            ->helperText('Scheduled start date & time')
                            ->columnSpan(1),

                        RichEditor::make('description')
                            ->columnSpanFull()
                            ->toolbarButtons([
                                'bold', 'italic', 'link', 'bulletList', 'orderedList', 'h2', 'h3', 'blockquote', 'codeBlock',
                            ])
                            ->placeholder('Write a brief overview of the contest...')
                            ->helperText('Optional detailed description.'),

                        TextInput::make('standings_url')
                            ->url()
                            ->placeholder('https://...')
                            ->helperText('Public standings or scoreboard link'),
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
