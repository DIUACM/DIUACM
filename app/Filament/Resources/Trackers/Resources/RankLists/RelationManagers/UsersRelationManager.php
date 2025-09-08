<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\RelationManagers;

use App\Services\RankListScoreService;
use Filament\Actions\Action;
use Filament\Actions\AttachAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
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
                Action::make('attachUsersFromAttendance')
                    ->label('Attach Users from Attendance')
                    ->action(function (): void {
                        $userIds = $this->ownerRecord
                            ->events()
                            ->with('attendees:id')
                            ->get()
                            ->pluck('attendees.*.id')
                            ->flatten()
                            ->unique()
                            ->values()
                            ->all();

                        if (! empty($userIds)) {
                            $this->ownerRecord->users()->syncWithoutDetaching($userIds);
                        }
                    }),
                Action::make('recalculateAllScores')
                    ->label('Recalculate All Scores')
                    ->icon('heroicon-o-calculator')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Recalculate All User Scores')
                    ->modalDescription('This will recalculate scores for all users in this ranklist based on their event participation and solve statistics. This action cannot be undone.')
                    ->modalSubmitActionLabel('Recalculate All Scores')
                    ->action(function (RankListScoreService $scoreService): void {
                        $result = $scoreService->recalculateScoresForRankList($this->ownerRecord);

                        if ($result['success']) {
                            Notification::make()
                                ->title('Scores Recalculated Successfully')
                                ->body("Updated scores for {$result['processed_users']} user(s).")
                                ->success()
                                ->send();
                        } else {
                            Notification::make()
                                ->title('Recalculation Failed')
                                ->body($result['message'])
                                ->warning()
                                ->send();
                        }

                        // Refresh the table to show updated scores
                        $this->resetTable();
                    }),
            ])
            ->recordActions([
                Action::make('editScore')
                    ->label('Edit Score')
                    ->icon('heroicon-o-pencil')
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
                Action::make('recalculateScore')
                    ->label('Recalculate Score')
                    ->icon('heroicon-o-calculator')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading(fn (\App\Models\User $record): string => "Recalculate Score for {$record->name}")
                    ->modalDescription('This will recalculate the score for this user based on their event participation and solve statistics. This action cannot be undone.')
                    ->modalSubmitActionLabel('Recalculate Score')
                    ->action(function (\App\Models\User $record, RankListScoreService $scoreService): void {
                        $result = $scoreService->recalculateScoreForUser($this->ownerRecord, $record);

                        if ($result['success']) {
                            Notification::make()
                                ->title('Score Recalculated Successfully')
                                ->body($result['message'])
                                ->success()
                                ->send();
                        } else {
                            Notification::make()
                                ->title('Recalculation Failed')
                                ->body($result['message'])
                                ->warning()
                                ->send();
                        }

                        // Refresh the table to show updated score
                        $this->resetTable();
                    }),
                DetachAction::make()
                    ->label('Detach')
                    ->icon('heroicon-o-trash'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DetachBulkAction::make()
                        ->label('Detach Selected'),
                ]),
            ]);
    }
}
