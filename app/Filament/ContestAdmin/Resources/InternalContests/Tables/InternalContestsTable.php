<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class InternalContestsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('banner_image')
                    ->collection('banner_image')
                    ->conversion('banner')
                    ->label('Banner')
                    ->circular()
                    ->toggleable(),
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('semester')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('registration_start_time')
                    ->dateTime()
                    ->sortable()
                    ->label('Registration Start'),
                TextColumn::make('registration_deadline')
                    ->dateTime()
                    ->sortable()
                    ->label('Deadline'),
                TextColumn::make('registration_limit')
                    ->numeric()
                    ->sortable()
                    ->label('Limit')
                    ->placeholder('Unlimited'),
                TextColumn::make('registration_fee')
                    ->money('BDT')
                    ->sortable()
                    ->label('Fee'),
                TextColumn::make('status')
                    ->badge()
                    ->colors([
                        'warning' => 'draft',
                        'success' => 'published',
                        'danger' => 'closed',
                    ])
                    ->searchable()
                    ->sortable(),
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
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'published' => 'Published',
                        'closed' => 'Closed',
                    ])
                    ->native(false),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
