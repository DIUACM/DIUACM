<?php

namespace App\Filament\Resources\Trackers\Schemas;

use App\Enums\VisibilityStatus;
use App\Models\Tracker;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class TrackerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic Information')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(fn (string $context, $state, callable $set) => $context === 'create' ? $set('slug', Str::slug($state)) : null
                            ),

                        TextInput::make('slug')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->rules(['alpha_dash'])
                            ->helperText('URL-friendly version of the title. Only letters, numbers, dashes and underscores allowed.'),

                        RichEditor::make('description')
                            ->columnSpanFull()
                            ->toolbarButtons([
                                'bold',
                                'italic',
                                'link',
                                'bulletList',
                                'orderedList',
                                'h2',
                                'h3',
                                'blockquote',
                                'codeBlock',
                            ])
                            ->placeholder('Enter tracker description')
                            ->helperText('Optional description of what this tracker is for'),
                    ]),

                Section::make('Settings')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                ToggleButtons::make('status')
                                    ->options(VisibilityStatus::class)
                                    ->default(VisibilityStatus::DRAFT)
                                    ->inline()
                                    ->required()
                                    ->helperText('Draft trackers are not visible to the public'),

                                TextInput::make('order')
                                    ->required()
                                    ->numeric()
                                    ->default(0)
                                    ->minValue(0)
                                    ->maxValue(999999)
                                    ->step(1)
                                    ->helperText('Lower numbers appear first in listings'),
                            ]),
                    ]),

                Section::make('Tracker History')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextEntry::make('created_at')
                                    ->label('Created Date')
                                    ->formatStateUsing(fn (?Tracker $record): string => $record?->created_at?->diffForHumans() ?? '-'),

                                TextEntry::make('updated_at')
                                    ->label('Last Modified Date')
                                    ->formatStateUsing(fn (?Tracker $record): string => $record?->updated_at?->diffForHumans() ?? '-'),
                            ]),
                    ])->collapsed(),
            ]);
    }
}
