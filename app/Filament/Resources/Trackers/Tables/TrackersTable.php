<?php

namespace App\Filament\Resources\Trackers\Tables;

use App\Enums\VisibilityStatus;
use App\Filament\Resources\Trackers\TrackerResource;
use Filament\Actions\Action;
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
            ->reorderable('order')
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
                    ->alignCenter(),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->color(Color::Gray)
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
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
                Action::make('rank_lists')
                    ->label('Rank Lists')
                    ->icon('heroicon-o-rectangle-stack')
                    ->color('gray')
                    ->url(fn ($record) => TrackerResource::getUrl('rank-lists', ['record' => $record]))
                    ->tooltip('Manage rank lists for this tracker'),
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
