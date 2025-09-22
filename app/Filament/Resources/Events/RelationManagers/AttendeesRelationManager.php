<?php

namespace App\Filament\Resources\Events\RelationManagers;

use Filament\Actions\AttachAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AttendeesRelationManager extends RelationManager
{
    protected static string $relationship = 'attendees';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                // No form needed for simple attendance
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitle(fn (\App\Models\User $record): string => "{$record->name} ({$record->username})")
            ->inverseRelationship('attendedEvents')
            ->columns([
                SpatieMediaLibraryImageColumn::make('image')
                    ->collection('profile_picture')
                    ->visibility('public')
                    ->label('Avatar')
                    ->circular()
                    ->imageSize(36),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('pivot.created_at')
                    ->label('Attendance Time')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->sortable(['pivot_created_at']),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                AttachAction::make()
                    ->recordSelectSearchColumns(['email', 'name', 'student_id', 'username', 'phone', 'codeforces_handle', 'atcoder_handle', 'vjudge_handle'])
                    ->preloadRecordSelect()
                    ->label('Mark Attendance')
                    ->multiple()
                    ->modalHeading('Mark User Attendance'),
            ])
            ->recordActions([
                DetachAction::make()
                    ->label('Remove Attendance'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DetachBulkAction::make()
                        ->label('Remove Selected Attendances'),
                ]),
            ]);
    }
}
