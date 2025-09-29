<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\Tables;

use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class RankListsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('order', 'asc')
            ->reorderable('order')
            ->columns([
                TextColumn::make('keyword')
                    ->label('Keyword')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record): string => str($record->description ?? '')->stripTags()->limit(60))
                    ->limit(30)
                    ->weight('medium'),

                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor()),

                TextColumn::make('weight_of_upsolve')
                    ->label('Upsolve Weight')
                    ->numeric(decimalPlaces: 2)
                    ->sortable()
                    ->color(fn ($state): string => $state > 0 ? Color::Green[500] : Color::Gray[500])
                    ->formatStateUsing(fn ($state): string => number_format($state * 100, 1).'%'),

                TextColumn::make('order')
                    ->label('Display Order')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color(Color::Blue),

                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->trueIcon('heroicon-m-check-circle')
                    ->falseIcon('heroicon-m-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                IconColumn::make('consider_strict_attendance')
                    ->label('Strict Attendance')
                    ->boolean()
                    ->trueIcon('heroicon-m-lock-closed')
                    ->falseIcon('heroicon-m-lock-open')
                    ->trueColor('warning')
                    ->falseColor('success')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(VisibilityStatus::class)
                    ->multiple(),

                TernaryFilter::make('is_active')
                    ->label('Active Status')
                    ->placeholder('All rank lists')
                    ->trueLabel('Active')
                    ->falseLabel('Inactive'),

                TernaryFilter::make('consider_strict_attendance')
                    ->label('Strict Attendance')
                    ->placeholder('All rank lists')
                    ->trueLabel('Strict')
                    ->falseLabel('Not Strict'),
            ])
            ->recordActions([
                EditAction::make(),
                ViewAction::make(),
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
