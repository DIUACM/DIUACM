<?php

namespace App\Filament\Resources\Contests\Pages;

use App\Filament\Resources\Contests\ContestResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditContest extends EditRecord
{
    protected static string $resource = ContestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
