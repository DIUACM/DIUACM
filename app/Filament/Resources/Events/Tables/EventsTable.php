<?php

namespace App\Filament\Resources\Events\Tables;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class EventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('starting_at', 'desc')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record): string => str($record->description ?? '')->stripTags()->limit(50))
                    ->limit(40)
                    ->weight('medium'),

                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor()),

                TextColumn::make('type')
                    ->badge()
                    ->formatStateUsing(fn (?EventType $state): ?string => $state?->getLabel())
                    ->color(fn (?EventType $state): string|array|null => $state?->getColor())
                    ->icon(fn (?EventType $state): ?string => $state?->getIcon()),

                TextColumn::make('starting_at')
                    ->label('Starts At')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->color(fn ($record): string => $record->starting_at && $record->starting_at->isPast()
                            ? Color::Red[500]
                            : ($record->starting_at && $record->starting_at->isToday()
                                ? Color::Orange[500]
                                : Color::Green[500])
                    ),

                TextColumn::make('ending_at')
                    ->label('Ends At')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('participation_scope')
                    ->label('Scope')
                    ->badge()
                    ->formatStateUsing(fn (?ParticipationScope $state): ?string => $state?->getLabel())
                    ->color(fn (?ParticipationScope $state): string|array|null => $state?->getColor())
                    ->icon(fn (?ParticipationScope $state): ?string => $state?->getIcon()),

                IconColumn::make('open_for_attendance')
                    ->label('Attendance')
                    ->boolean()
                    ->trueIcon('heroicon-m-check-circle')
                    ->falseIcon('heroicon-m-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                IconColumn::make('strict_attendance')
                    ->label('Strict')
                    ->boolean()
                    ->trueIcon('heroicon-m-lock-closed')
                    ->falseIcon('heroicon-m-lock-open')
                    ->trueColor('warning')
                    ->falseColor('success')
                    ->toggleable(isToggledHiddenByDefault: true),

                IconColumn::make('auto_update_score')
                    ->label('Auto Score')
                    ->boolean()
                    ->trueIcon('heroicon-m-arrow-path')
                    ->falseIcon('heroicon-m-pause')
                    ->trueColor('success')
                    ->falseColor('gray')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('event_link')
                    ->label('Link')
                    ->url(fn ($record): ?string => $record->event_link ?: null, shouldOpenInNewTab: true)
                    ->copyable()
                    ->copyMessage('Link copied')
                    ->placeholder('No link')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->limit(30),

                TextColumn::make('created_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(VisibilityStatus::class)
                    ->multiple(),

                SelectFilter::make('type')
                    ->options(EventType::class)
                    ->multiple(),

                SelectFilter::make('participation_scope')
                    ->label('Participation Scope')
                    ->options(ParticipationScope::class)
                    ->multiple(),

                TernaryFilter::make('open_for_attendance')
                    ->label('Open for Attendance')
                    ->placeholder('All events')
                    ->trueLabel('Open')
                    ->falseLabel('Closed'),

                TernaryFilter::make('strict_attendance')
                    ->label('Strict Attendance')
                    ->placeholder('All events')
                    ->trueLabel('Strict')
                    ->falseLabel('Not Strict'),

                TernaryFilter::make('auto_update_score')
                    ->label('Auto Update Score')
                    ->placeholder('All events')
                    ->trueLabel('Enabled')
                    ->falseLabel('Disabled'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->striped()
            ->paginated([10, 25, 50, 100])
            ->defaultPaginationPageOption(25);
    }
}
