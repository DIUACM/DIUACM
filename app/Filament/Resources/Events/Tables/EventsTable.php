<?php

namespace App\Filament\Resources\Events\Tables;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
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
                    ->limit(40),
                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor()),
                TextColumn::make('starting_at')
                    ->dateTime()
                    ->timezone('Asia/Dhaka')
                    ->sortable(),
                TextColumn::make('ending_at')
                    ->dateTime()
                    ->timezone('Asia/Dhaka')
                    ->sortable(),
                TextColumn::make('event_link')
                    ->url(fn ($record): ?string => $record->event_link ?: null, shouldOpenInNewTab: true)
                    ->copyable()
                    ->copyMessage('Link copied')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->searchable(),
                IconColumn::make('open_for_attendance')
                    ->boolean(),
                IconColumn::make('strict_attendance')
                    ->boolean(),
                TextColumn::make('type')
                    ->badge()
                    ->formatStateUsing(fn (?EventType $state): ?string => $state?->getLabel())
                    ->color(fn (?EventType $state): string|array|null => $state?->getColor()),
                TextColumn::make('participation_scope')
                    ->badge()
                    ->formatStateUsing(fn (?ParticipationScope $state): ?string => $state?->getLabel())
                    ->color(fn (?ParticipationScope $state): string|array|null => $state?->getColor()),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(VisibilityStatus::class),
                SelectFilter::make('type')
                    ->options(EventType::class),
                SelectFilter::make('participation_scope')
                    ->options(ParticipationScope::class),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
