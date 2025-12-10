<?php

namespace App\Filament\Resources\IncentiveApplications\Pages;

use App\Filament\Resources\IncentiveApplications\IncentiveApplicationResource;
use Filament\Resources\Pages\ListRecords;

class ListIncentiveApplications extends ListRecords
{
    protected static string $resource = IncentiveApplicationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            //
        ];
    }
}
