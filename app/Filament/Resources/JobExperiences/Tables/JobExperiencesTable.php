<?php

namespace App\Filament\Resources\JobExperiences\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class JobExperiencesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('images')
                    ->collection('images')
                    ->conversion('thumb')
                    ->circular()
                    ->stacked()
                    ->limit(3),

                TextColumn::make('user.name')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record) => $record->user?->username),

                TextColumn::make('company_name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('position')
                    ->searchable()
                    ->sortable(),

                IconColumn::make('is_current')
                    ->boolean()
                    ->label('Current'),

                TextColumn::make('start_date')
                    ->date('M Y')
                    ->sortable(),

                TextColumn::make('end_date')
                    ->date('M Y')
                    ->sortable()
                    ->placeholder('Present'),

                TextColumn::make('location')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('user')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),

                SelectFilter::make('is_current')
                    ->label('Employment Status')
                    ->options([
                        true => 'Current',
                        false => 'Past',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('start_date', 'desc');
    }
}
