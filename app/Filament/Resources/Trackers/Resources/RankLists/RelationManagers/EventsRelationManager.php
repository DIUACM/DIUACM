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

class EventsRelationManager extends RelationManager
{
    protected static string $relationship = 'events';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            // No standalone form for this relation manager.
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitle(fn (\App\Models\Event $record): string => "{$record->title} (".optional($record->starting_at)->setTimezone('Asia/Dhaka')?->format('M j, Y').')')
            ->inverseRelationship('rankLists')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('starting_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->label('Starts')
                    ->sortable(),
                TextColumn::make('ending_at')
                    ->dateTime('M j, Y g:i A')
                    ->timezone('Asia/Dhaka')
                    ->label('Ends')
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
                    ->label('Attach Event')
                    ->modalHeading('Attach Event with Weight')
                    ->recordSelectSearchColumns(['title', 'description', 'event_link'])
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
                    ->fillForm(function (\App\Models\Event $record): array {
                        return [
                            'weight' => $record->pivot->weight,
                        ];
                    })
                    ->action(function (\App\Models\Event $record, array $data): void {
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
