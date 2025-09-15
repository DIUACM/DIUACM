<?php

namespace App\Filament\Resources\Contests\Tables;

use App\Enums\ContestType;
use App\Filament\Resources\Contests\ContestResource;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ContestsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('date', 'desc')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->limit(40)
                    ->weight('medium'),
                TextColumn::make('gallery_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('contest_type')
                    ->badge()
                    ->color(Color::Blue),
                TextColumn::make('location')
                    ->searchable(),
                TextColumn::make('date')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('teams_count')
                    ->label('Teams')
                    ->counts('teams')
                    ->badge()
                    ->color(Color::Green)
                    ->alignCenter(),
                TextColumn::make('standings_url')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('contest_type')
                    ->options(ContestType::class)
                    ->multiple()
                    ->preload(),
            ])
            ->recordActions([
                Action::make('teams')
                    ->label('Teams')
                    ->icon('heroicon-o-users')
                    ->color('gray')
                    ->url(fn ($record) => ContestResource::getUrl('teams', ['record' => $record]))
                    ->tooltip('Manage teams for this contest'),
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
            ->emptyStateHeading('No contests found')
            ->emptyStateDescription('Create your first contest to get started.')
            ->persistSortInSession()
            ->persistSearchInSession()
            ->persistFiltersInSession();
    }
}
