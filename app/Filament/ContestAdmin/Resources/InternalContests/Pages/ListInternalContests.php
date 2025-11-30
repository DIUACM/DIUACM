<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListInternalContests extends ListRecords
{
    protected static string $resource = InternalContestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
