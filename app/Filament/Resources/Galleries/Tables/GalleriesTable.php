<?php

namespace App\Filament\Resources\Galleries\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;

class GalleriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('attachments')
                    ->label('Cover')
                    ->formatStateUsing(function ($state) {
                        if (is_array($state) && isset($state[0])) {
                            return '🖼️';
                        }

                        return '—';
                    })
                    ->tooltip(fn ($record) => is_array($record->attachments) ? implode(', ', array_slice($record->attachments, 0, 3)) : null)
                    ->toggleable(),
                TextColumn::make('title')
                    ->searchable()
                    ->limit(40),
                TextColumn::make('description')
                    ->label('Description')
                    ->toggleable()
                    ->limit(60)
                    ->searchable(),
                TextColumn::make('attachments')
                    ->label('Images')
                    ->formatStateUsing(fn ($state) => is_array($state) ? count($state) : 0)
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'success' : 'gray'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: false),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Filter::make('created_between')
                    ->form([
                        DatePicker::make('created_from')->label('Created From'),
                        DatePicker::make('created_until')->label('Created Until'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['created_from'] ?? null, fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
                            ->when($data['created_until'] ?? null, fn ($q, $date) => $q->whereDate('created_at', '<=', $date));
                    }),
                Filter::make('has_images')
                    ->label('Has Images')
                    ->query(fn ($query) => $query->whereNotNull('attachments')->whereJsonLength('attachments', '>', 0)),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
