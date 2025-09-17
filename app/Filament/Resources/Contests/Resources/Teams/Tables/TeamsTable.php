<?php

namespace App\Filament\Resources\Contests\Resources\Teams\Tables;

use App\Filament\Resources\Contests\ContestResource;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TeamsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('rank', 'asc')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->limit(40)
                    ->weight('medium'),
                TextColumn::make('rank')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color(Color::Blue)
                    ->alignCenter(),
                TextColumn::make('solve_count')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color(Color::Green)
                    ->alignCenter(),
                TextColumn::make('members_count')
                    ->label('Members')
                    ->counts('members')
                    ->badge()
                    ->color(Color::Purple)
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
                SelectFilter::make('members')
                    ->label('Has Members')
                    ->options([
                        'with' => 'With Members',
                        'without' => 'Without Members',
                    ])
                    ->query(function ($query, $data) {
                        return match ($data['value'] ?? null) {
                            'with' => $query->has('members'),
                            'without' => $query->doesntHave('members'),
                            default => $query,
                        };
                    }),
            ])
            ->recordActions([
                Action::make('contest')
                    ->label('Contest')
                    ->icon('heroicon-o-globe-alt')
                    ->color('gray')
                    ->url(fn ($record) => ContestResource::getUrl('edit', ['record' => $record->contest_id]))
                    ->tooltip('View parent contest'),
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
            ->emptyStateHeading('No teams found')
            ->emptyStateDescription('Create the first team for this contest.')
            ->persistSortInSession()
            ->persistSearchInSession()
            ->persistFiltersInSession();
    }
}
