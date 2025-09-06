<?php

namespace App\Filament\Resources\Events\Schemas;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class EventForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->required(),
                Textarea::make('description')
                    ->required()
                    ->columnSpanFull(),
                Select::make('status')
                    ->options(VisibilityStatus::class)
                    ->required(),
                DateTimePicker::make('starting_at')
                    ->required(),
                DateTimePicker::make('ending_at')
                    ->required(),
                TextInput::make('event_link')
                    ->required(),
                TextInput::make('event_password')
                    ->password()
                    ->required(),
                Toggle::make('open_for_attendance')
                    ->required(),
                Toggle::make('strict_attendance')
                    ->required(),
                Select::make('type')
                    ->options(EventType::class)
                    ->required(),
                Select::make('participation_scope')
                    ->options(ParticipationScope::class)
                    ->required(),
            ]);
    }
}
