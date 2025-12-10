<?php

namespace App\Filament\Resources\IncentiveApplications\Pages;

use App\Filament\Resources\IncentiveApplications\IncentiveApplicationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditIncentiveApplication extends EditRecord
{
    protected static string $resource = IncentiveApplicationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
