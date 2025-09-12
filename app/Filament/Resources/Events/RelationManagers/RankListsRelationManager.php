<?php

namespace App\Filament\Resources\Events\RelationManagers;

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

class RankListsRelationManager extends RelationManager
{
    protected static string $relationship = 'rankLists';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            // No standalone form for this relation manager.
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitle(fn (\App\Models\RankList $record): string => "{$record->tracker->title} ({$record->keyword})")
            ->inverseRelationship('events')
            ->columns([
                TextColumn::make('tracker.title')
                    ->label('Tracker')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('keyword')
                    ->label('Keyword')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('pivot.weight')
                    ->label('Weight')
                    ->numeric(2)
                    ->sortable(['pivot_weight']),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                AttachAction::make()
                    ->multiple()
                    ->preloadRecordSelect()
                    ->label('Attach Rank List')
                    ->modalHeading('Attach Rank List with Weight')
                    ->recordSelectSearchColumns(['keyword', 'description'])
                    ->schema(function (AttachAction $action): array {
                        return [
                            $action->getRecordSelect(),
                            TextInput::make('weight')
                                ->label('Weight')
                                ->numeric()
                                ->default(1)
                                ->step(0.01)
                                ->minValue(0)
                                ->maxValue(1)
                                ->required(),
                        ];
                    }),
            ])
            ->recordActions([
                Action::make('editWeight')
                    ->label('Edit Weight')
                    ->modalWidth('xl')
                    ->schema([
                        TextInput::make('weight')
                            ->label('Weight')
                            ->numeric()
                            ->step(0.01)
                            ->minValue(0)
                            ->maxValue(1)
                            ->required(),
                    ])
                    ->fillForm(function (\App\Models\RankList $record): array {
                        return [
                            'weight' => $record->pivot->weight,
                        ];
                    })
                    ->action(function (\App\Models\RankList $record, array $data): void {
                        $this->getRelationship()->updateExistingPivot($record->getKey(), [
                            'weight' => $data['weight'],
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
