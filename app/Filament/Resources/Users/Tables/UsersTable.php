<?php

namespace App\Filament\Resources\Users\Tables;

use App\Enums\Gender;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->searchable([
                'name',
                'email',
                'username',
                'phone',
                'student_id',
                'codeforces_handle',
                'atcoder_handle',
                'vjudge_handle',
            ])
            ->columns([
                SpatieMediaLibraryImageColumn::make('Avatar')
                    ->collection('profile_picture')
                    ->conversion('thumb')
                    ->visibility('public')
                    ->circular()
                    ->imageSize(36),

                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('medium')
                    ->description(fn ($record): string => $record->username ? '@'.$record->username : ''),

                TextColumn::make('email')
                    ->label('Email')
                    ->copyable()
                    ->copyMessage('Email copied')
                    ->searchable(),

                TextColumn::make('gender')
                    ->badge()
                    ->formatStateUsing(fn (?Gender $state): ?string => $state?->getLabel())
                    ->color(fn (?Gender $state): string|array|null => $state?->getColor()),

                TextColumn::make('phone')
                    ->placeholder('-')
                    ->searchable(),

                TextColumn::make('max_cf_rating')
                    ->label('CF Max')
                    ->numeric()
                    ->sortable()
                    ->color(fn ($record): string => ($record->max_cf_rating ?? -1) >= 2000
                        ? Color::Green[500]
                        : (($record->max_cf_rating ?? -1) >= 1200
                            ? Color::Orange[500]
                            : Color::Gray[500])
                    )
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('email_verified_at')
                    ->label('Verified At')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('department')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('student_id')
                    ->label('Student ID')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('gender')
                    ->options(Gender::class)
                    ->multiple(),

                TernaryFilter::make('email_verified_at')
                    ->label('Email Verified')
                    ->nullable(),
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
