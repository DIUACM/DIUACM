<?php

namespace App\Filament\Resources\Contests\Pages;

use App\Filament\Resources\Contests\ContestResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditContest extends EditRecord
{
    protected static string $resource = ContestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('teams')
                ->label('Manage Teams')
                ->icon('heroicon-o-users')
                ->url(fn () => ContestResource::getUrl('teams', ['record' => $this->record])),
            DeleteAction::make(),
        ];
    }
}
