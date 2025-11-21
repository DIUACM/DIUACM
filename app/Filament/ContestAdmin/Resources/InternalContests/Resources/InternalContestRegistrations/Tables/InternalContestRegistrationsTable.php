<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Tables;

use App\Enums\Gender;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Colors\Color;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class InternalContestRegistrationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('medium')
                    ->limit(30),

                TextColumn::make('student_id')
                    ->label('Student ID')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->copyMessage('Student ID copied')
                    ->limit(20),

                TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->limit(30)
                    ->toggleable(),

                TextColumn::make('phone')
                    ->label('Phone')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('department')
                    ->searchable()
                    ->sortable()
                    ->limit(20),

                TextColumn::make('section')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('gender')
                    ->badge()
                    ->sortable(),

                TextColumn::make('tshirt_size')
                    ->label('T-Shirt')
                    ->badge()
                    ->color(Color::Gray)
                    ->toggleable(),

                IconColumn::make('transport_service_required')
                    ->label('Transport')
                    ->boolean()
                    ->alignCenter()
                    ->toggleable(),

                TextColumn::make('pickup_point')
                    ->label('Pickup Point')
                    ->searchable()
                    ->limit(20)
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->sortable()
                    ->state(fn ($record) => $record->getStatus())
                    ->colors([
                        'success' => 'paid',
                        'warning' => 'pending',
                        'danger' => 'canceled',
                    ]),

                TextColumn::make('user.name')
                    ->label('User Account')
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->label('Registered At')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('updated_at')
                    ->label('Updated At')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('gender')
                    ->options(Gender::class)
                    ->multiple()
                    ->preload(),

                SelectFilter::make('transport_service_required')
                    ->label('Transport Service')
                    ->options([
                        1 => 'Required',
                        0 => 'Not Required',
                    ]),

                SelectFilter::make('department')
                    ->options(fn () => \App\Models\InternalContestRegistration::query()
                        ->distinct()
                        ->pluck('department', 'department')
                        ->toArray())
                    ->searchable()
                    ->multiple()
                    ->preload(),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
