<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\RelationManagers;

use Filament\Actions\Action;
use Filament\Actions\AttachAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class UsersRelationManager extends RelationManager
{
    protected static string $relationship = 'users';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            // No standalone form for this relation manager.
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitle(fn (\App\Models\User $record): string => $record->username
                ? ($record->name.' (@'.$record->username.')')
                : $record->name)
            ->inverseRelationship('rankLists')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('username')
                    ->label('Username')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('pivot.score')
                    ->label('Score')
                    ->numeric(2)
                    ->sortable(['pivot_score']),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                AttachAction::make()
                    ->multiple()
                    ->preloadRecordSelect()
                    ->label('Attach User')
                    ->modalHeading('Attach User with Score')
                    ->recordSelectSearchColumns(['name', 'username', 'email'])
                    ->schema(function (AttachAction $action): array {
                        return [
                            $action->getRecordSelect(),
                            TextInput::make('score')
                                ->label('Score')
                                ->numeric()
                                ->default(0)
                                ->step(0.01)
                                ->minValue(0)
                                ->required(),
                        ];
                    }),
            ])
            ->recordActions([
                Action::make('editScore')
                    ->label('Edit Score')
                    ->modalWidth('xl')
                    ->schema([
                        TextInput::make('score')
                            ->label('Score')
                            ->numeric()
                            ->step(0.01)
                            ->minValue(0)
                            ->required(),
                    ])
                    ->fillForm(function (\App\Models\User $record): array {
                        return [
                            'score' => $record->pivot->score,
                        ];
                    })
                    ->action(function (\App\Models\User $record, array $data): void {
                        $this->getRelationship()->updateExistingPivot($record->getKey(), [
                            'score' => $data['score'],
                        ]);
                    }),
                DetachAction::make()
                    ->label('Detach'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DetachBulkAction::make()
                        ->label('Detach Selected'),
                ]),
            ]);
    }
}
