<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\Schemas;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class RankListForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic Information')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('keyword')
                            ->label('Keyword')
                            ->helperText('A unique identifier for this rank list')
                            ->required(),

                        RichEditor::make('description')
                            ->label('Description')
                            ->toolbarButtons([
                                'bold',
                                'italic',
                                'link',
                                'bulletList',
                                'orderedList',
                                'h3',
                                'blockquote',
                            ])
                            ->placeholder('Enter rank list description'),

                        Grid::make()
                            ->schema([
                                ToggleButtons::make('status')
                                    ->options(VisibilityStatus::class)
                                    ->default(VisibilityStatus::DRAFT)
                                    ->inline()
                                    ->required(),
                            ]),
                    ]),

                Section::make('Configuration')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('weight_of_upsolve')
                                    ->label('Upsolve Weight')
                                    ->helperText('Weight factor for upsolve problems (e.g., 0.25 means 25% of original points)')
                                    ->numeric()
                                    ->step(0.01)
                                    ->minValue(0)
                                    ->maxValue(1)
                                    ->default(0.25)
                                    ->required(),

                                TextInput::make('order')
                                    ->label('Display Order')
                                    ->helperText('Order in which this rank list appears (lower numbers appear first)')
                                    ->numeric()
                                    ->minValue(0)
                                    ->default(0)
                                    ->required(),
                            ]),

                        Grid::make()
                            ->schema([
                                Checkbox::make('is_active')
                                    ->label('Active')
                                    ->helperText('Enable this rank list for display and calculations')
                                    ->default(true),

                                Checkbox::make('consider_strict_attendance')
                                    ->label('Strict Attendance')
                                    ->helperText('Only consider problems solved by users who attended the event'),
                            ]),
                    ]),
            ]);
    }
}
