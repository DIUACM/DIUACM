<?php

namespace App\Filament\Resources\Events\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class EventUserStatsRelationManager extends RelationManager
{
    protected static string $relationship = 'eventUserStats';

    protected static ?string $recordTitleAttribute = 'user.name';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->label('User')
                    ->relationship('user', 'name')
                    ->searchable(['name', 'email', 'username', 'student_id'])
                    ->preload()
                    ->required()
                    ->columnSpanFull()
                    ->unique('event_user_stats', 'user_id', modifyRuleUsing: function ($rule, $get, $record) {
                        return $rule->where('event_id', $this->getOwnerRecord()->id)
                            ->ignore($record?->id);
                    }),

                TextInput::make('solves_count')
                    ->label('Solves Count')
                    ->numeric()
                    ->default(0)
                    ->minValue(0)
                    ->required(),

                TextInput::make('upsolves_count')
                    ->label('Upsolves Count')
                    ->numeric()
                    ->default(0)
                    ->minValue(0)
                    ->required(),

                Checkbox::make('participation')
                    ->label('Participated')
                    ->default(false),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitle(fn ($record): string => "{$record->user->name} - Stats")
            ->columns([
                ImageColumn::make('user.image')
                    ->disk('public')
                    ->label('Avatar')
                    ->circular()
                    ->imageSize(36),

                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('user.username')
                    ->label('Username')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('solves_count')
                    ->label('Solves')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('success'),

                TextColumn::make('upsolves_count')
                    ->label('Upsolves')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('info'),

                IconColumn::make('participation')
                    ->label('Participated')
                    ->boolean()
                    ->sortable(),

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
                TernaryFilter::make('participation')
                    ->label('Participation Status')
                    ->placeholder('All users')
                    ->trueLabel('Participated')
                    ->falseLabel('Did not participate'),
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Add User Stats')
                    ->modalHeading('Add User Statistics'),
            ])
            ->recordActions([
                EditAction::make()
                    ->label('Edit Stats'),
                DeleteAction::make()
                    ->label('Delete Stats'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->label('Delete Selected'),
                ]),
            ])
            ->defaultSort('solves_count', 'desc');
    }
}
