<?php

namespace App\Filament\Resources\IncentiveApplications\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class IncentiveApplicationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->searchable([
                'full_name',
                'email',
                'student_id',
                'phone_number',
                'batch',
            ])
            ->columns([
                TextColumn::make('full_name')
                    ->label('Full Name')
                    ->searchable()
                    ->sortable()
                    ->weight('medium'),

                TextColumn::make('student_id')
                    ->label('Student ID')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->label('Email')
                    ->copyable()
                    ->copyMessage('Email copied')
                    ->searchable(),

                TextColumn::make('batch')
                    ->label('Batch')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('current_semester')
                    ->label('Semester')
                    ->sortable(),

                TextColumn::make('phone_number')
                    ->label('Phone')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('courses')
                    ->label('Courses')
                    ->formatStateUsing(fn ($state): string => is_array($state) ? count($state).' course(s)' : '0 courses')
                    ->badge(),

                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->label('Submitted At')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable(),

                TextColumn::make('updated_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('batch')
                    ->options(fn (): array => \App\Models\IncentiveApplication::query()
                        ->distinct()
                        ->pluck('batch', 'batch')
                        ->toArray()
                    ),
                SelectFilter::make('current_semester')
                    ->label('Semester')
                    ->options(fn (): array => \App\Models\IncentiveApplication::query()
                        ->distinct()
                        ->pluck('current_semester', 'current_semester')
                        ->toArray()
                    ),
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
            ->striped()
            ->paginated([10, 25, 50, 100])
            ->defaultPaginationPageOption(25);
    }
}
