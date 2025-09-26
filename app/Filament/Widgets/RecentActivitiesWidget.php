<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;

class RecentActivitiesWidget extends TableWidget
{
    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Recent User Registrations';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                User::query()
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                TextColumn::make('name')
                    ->label('Name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('student_id')
                    ->label('Student ID')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('codeforces_handle')
                    ->label('Codeforces Handle')
                    ->sortable()
                    ->placeholder('N/A'),

                TextColumn::make('created_at')
                    ->label('Registered')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated(false);
    }
}
