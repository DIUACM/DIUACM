<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\InternalContestRegistrationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditInternalContestRegistration extends EditRecord
{
    protected static string $resource = InternalContestRegistrationResource::class;

    protected function getHeaderActions(): array
    {
        return [

            DeleteAction::make(),
        ];
    }
}
