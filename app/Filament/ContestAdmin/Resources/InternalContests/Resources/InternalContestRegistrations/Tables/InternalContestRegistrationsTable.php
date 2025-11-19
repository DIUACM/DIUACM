<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class InternalContestRegistrationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('internal_contest_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('user_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('student_id')
                    ->searchable(),
                TextColumn::make('phone')
                    ->searchable(),
                TextColumn::make('section')
                    ->searchable(),
                TextColumn::make('department')
                    ->searchable(),
                TextColumn::make('lab_teacher_name')
                    ->searchable(),
                TextColumn::make('tshirt_size')
                    ->searchable(),
                TextColumn::make('gender')
                    ->badge()
                    ->searchable(),
                IconColumn::make('transport_service_required')
                    ->boolean(),
                TextColumn::make('pickup_point')
                    ->searchable(),
                TextColumn::make('payment_status')
                    ->badge()
                    ->searchable(),
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
                //
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
