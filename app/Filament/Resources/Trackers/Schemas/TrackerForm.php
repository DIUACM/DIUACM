<?php

namespace App\Filament\Resources\Trackers\Schemas;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class TrackerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Tracker Information')
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

                        Textarea::make('description')
                            ->columnSpanFull()
                            ->rows(3)
                            ->helperText('Optional description of what this tracker is for'),
                    ])
                    ->columns(2),

                Section::make('Settings')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('status')
                            ->options(VisibilityStatus::class)
                            ->default(VisibilityStatus::DRAFT->value)
                            ->required()
                            ->helperText('Draft trackers are not visible to the public'),

                        TextInput::make('order')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->helperText('Lower numbers appear first in listings'),
                    ])
                    ->columns(2),
            ]);
    }
}
