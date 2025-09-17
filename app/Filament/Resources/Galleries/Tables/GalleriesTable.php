<?php

namespace App\Filament\Resources\Galleries\Tables;

use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

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
                SpatieMediaLibraryImageColumn::make('Preview')
                    ->collection('gallery_images')
                    ->conversion('thumb')
                    ->imageHeight(40)
                    ->circular()
                    ->stacked()
                    ->limit(3)
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
                TextColumn::make('gallery_images')
                    ->label('Images')
                    ->getStateUsing(fn (Model $record): int => $record->getMedia('gallery_images')->count())
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
                    ->schema([
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
                    ->query(fn ($query) => $query->whereHas('media', fn ($q) => $q->where('collection_name', 'gallery_images'))),
                Filter::make('status')
                    ->schema([
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
