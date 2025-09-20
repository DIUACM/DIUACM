<?php

namespace App\Filament\Resources\BlogPosts\Tables;

use App\Enums\VisibilityStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\RichEditor\RichContentRenderer;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class BlogPostsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record): string => str(RichContentRenderer::make($record->content)->toHtml() ?? '')->stripTags()->limit(50))
                    ->limit(40)
                    ->weight('medium'),

                TextColumn::make('slug')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Slug copied')
                    ->limit(30)
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('author.name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (?VisibilityStatus $state): ?string => $state?->getLabel())
                    ->color(fn (?VisibilityStatus $state): string|array|null => $state?->getColor())
                    ->icon(fn (?VisibilityStatus $state): ?string => $state?->getIcon()),

                SpatieMediaLibraryImageColumn::make('featured_image')
                    ->collection('featured_image')
                    ->conversion('thumb')
                    ->label('Featured')
                    ->placeholder('No image')
                    ->toggleable(),

                TextColumn::make('published_at')
                    ->label('Published At')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->placeholder('Unpublished')
                    ->color(fn ($record): string => $record->published_at === null
                            ? Color::Gray[500]
                            : ($record->published_at->isFuture()
                                ? Color::Orange[500]
                                : Color::Green[500])
                    ),

                IconColumn::make('is_featured')
                    ->label('Featured')
                    ->boolean()
                    ->trueIcon('heroicon-m-star')
                    ->falseIcon('heroicon-m-star')
                    ->trueColor('warning')
                    ->falseColor('gray'),

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

                TernaryFilter::make('is_featured')
                    ->label('Featured Status')
                    ->placeholder('All posts')
                    ->trueLabel('Featured')
                    ->falseLabel('Not Featured'),

                TernaryFilter::make('published_at')
                    ->label('Published Status')
                    ->placeholder('All posts')
                    ->trueLabel('Published')
                    ->falseLabel('Draft/Unpublished')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('published_at')->where('published_at', '<=', now()),
                        false: fn ($query) => $query->where(function ($q) {
                            $q->whereNull('published_at')->orWhere('published_at', '>', now());
                        }),
                    ),
            ])
            ->recordActions([
                EditAction::make(),
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
