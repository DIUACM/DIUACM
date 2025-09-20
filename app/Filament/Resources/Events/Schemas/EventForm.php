<?php

namespace App\Filament\Resources\Events\Schemas;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class EventForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic Information')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('title')
                            ->required(),

                        MarkdownEditor::make('description')
                         
                            ->placeholder('Enter event description'),

                        Grid::make()
                            ->schema([
                                ToggleButtons::make('type')
                                    ->options(EventType::class)
                                    ->default(EventType::CONTEST)
                                    ->inline()
                                    ->required(),

                                ToggleButtons::make('status')
                                    ->options(VisibilityStatus::class)
                                    ->default(VisibilityStatus::DRAFT)
                                    ->inline()
                                    ->required(),
                            ]),
                    ]),

                Section::make('Event Schedule')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                DateTimePicker::make('starting_at')
                                    ->seconds(false)
                                    ->displayFormat('M j, Y g:i A')
                                    ->timezone('Asia/Dhaka')
                                    ->label('Starting Date')
                                    ->required(),

                                DateTimePicker::make('ending_at')
                                    ->seconds(false)
                                    ->displayFormat('M j, Y g:i A')
                                    ->label('Ending Date')
                                    ->timezone('Asia/Dhaka')
                                    ->after('starting_at')
                                    ->required(),

                                TextEntry::make('duration')
                                    ->live()
                                    ->formatStateUsing(fn ($get) => self::calculateRuntime($get('starting_at'), $get('ending_at')))
                                    ->hiddenOn('create'),
                            ]),
                    ]),

                Section::make('Event Access')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('event_link')
                                    ->unique(ignoreRecord: true)
                                    ->url()
                                    ->columnSpan(1),

                                TextInput::make('event_password')
                                    ->columnSpan(1),
                            ]),

                        Grid::make()
                            ->schema([
                                ToggleButtons::make('participation_scope')
                                    ->columnSpanFull()
                                    ->options(ParticipationScope::class)
                                    ->default(ParticipationScope::OPEN_FOR_ALL)
                                    ->inline()
                                    ->required(),

                                Checkbox::make('open_for_attendance')
                                    ->label('Open for Attendance')
                                    ->helperText('Check this if the event is ready for attendees'),

                                Checkbox::make('strict_attendance')
                                    ->label('Strict Attendance')
                                    ->helperText('If enabled then the users who didn\'t give attendance their solve count won\'t be counted.'),

                                Checkbox::make('auto_update_score')
                                    ->label('Auto Update Score')
                                    ->default(true)
                                    ->helperText('Automatically update user scores from VJudge. Disable to prevent score updates for this event.'),
                            ]),
                    ]),

                Section::make('Event History')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextEntry::make('created_at')
                                    ->label('Created Date')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),

                                TextEntry::make('updated_at')
                                    ->label('Last Modified Date')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                            ]),
                    ])->collapsed()
                    ->hiddenOn('create'),
            ]);
    }

    private static function calculateRuntime(?string $startingAt, ?string $endingAt): string
    {
        if (! $startingAt || ! $endingAt) {
            return 'Duration will be calculated when both dates are selected';
        }

        try {
            $tz = new \DateTimeZone('Asia/Dhaka');
            $start = new \DateTime($startingAt, $tz);
            $end = new \DateTime($endingAt, $tz);

            if ($end <= $start) {
                return 'End date must be after start date';
            }

            $interval = $start->diff($end);

            $parts = [];
            if ($interval->d > 0) {
                $parts[] = $interval->d.' day'.($interval->d > 1 ? 's' : '');
            }
            if ($interval->h > 0) {
                $parts[] = $interval->h.' hour'.($interval->h > 1 ? 's' : '');
            }
            if ($interval->i > 0) {
                $parts[] = $interval->i.' minute'.($interval->i > 1 ? 's' : '');
            }

            return empty($parts) ? 'Less than a minute' : 'Duration: '.implode(', ', $parts);
        } catch (\Exception $e) {
            return 'Invalid date format';
        }
    }
}
