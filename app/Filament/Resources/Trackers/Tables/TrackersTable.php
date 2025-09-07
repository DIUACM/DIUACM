<?php

namespace App\Filament\Resources\Trackers\Tables;

use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TrackersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('order', 'asc')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record): string => str($record->description ?? '')->stripTags()->limit(50))
                    ->limit(40)
                    ->weight('medium'),

                TextColumn::make('slug')
                    ->searchable()
                    ->sortable()
                    ->label('URL Slug')
                    ->limit(30)
                    ->fontFamily('mono')
                    ->color(Color::Gray),

                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor())
                    ->icon(fn (?VisibilityStatus $state): ?string => $state?->getIcon())
                    ->sortable(),

                TextColumn::make('order')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color(Color::Blue)
                    ->alignCenter(),

                TextColumn::make('rank_lists_count')
                    ->label('Rank Lists')
                    ->counts('rankLists')
                    ->badge()
                    ->color(Color::Green)
                    ->alignCenter()
                    ->description('Number of rank lists'),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->color(Color::Gray)
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->color(Color::Gray)
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(VisibilityStatus::class)
                    ->multiple()
                    ->preload(),
            ])
            ->recordActions([
                EditAction::make()
                    ->iconButton(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->striped()
            ->paginated([10, 25, 50, 100])
            ->defaultPaginationPageOption(25)
            ->emptyStateHeading('No trackers found')
            ->emptyStateDescription('Get started by creating your first tracker.')
            ->persistSortInSession()
            ->persistSearchInSession()
            ->persistFiltersInSession();
    }
}
