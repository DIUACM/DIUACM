<?php

namespace App\Filament\Resources\Galleries\Tables;

use App\Enums\VisibilityStatus;
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
                TextColumn::make('status')
                    ->label('Status')
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor())
                    ->icon(fn (?VisibilityStatus $state): ?string => $state?->getIcon())
                    ->sortable()
                    ->badge()
                    ->toggleable(isToggledHiddenByDefault: false),
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
                TextColumn::make('slug')
                    ->label('Slug')
                    ->searchable()
                    ->limit(30)
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->copyable()
                    ->copyMessage('Slug copied to clipboard'),
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
                Filter::make('status')
                    ->form([
                        \Filament\Forms\Components\Select::make('status')
                            ->label('Status')
                            ->options(VisibilityStatus::class),
                    ])
                    ->query(fn ($query, array $data) => $query->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status))),
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
