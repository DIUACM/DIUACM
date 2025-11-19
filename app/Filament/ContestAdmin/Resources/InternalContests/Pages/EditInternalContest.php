<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditInternalContest extends EditRecord
{
    protected static string $resource = InternalContestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
