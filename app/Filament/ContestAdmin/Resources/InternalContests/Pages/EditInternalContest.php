<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditInternalContest extends EditRecord
{
    protected static string $resource = InternalContestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('registrations')
                ->label('Manage Registrations')
                ->icon('heroicon-o-users')
                ->url(fn () => InternalContestResource::getUrl('registrations', ['record' => $this->record])),
            DeleteAction::make(),
        ];
    }
}
