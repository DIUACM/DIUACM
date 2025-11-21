<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions\Pages;

use App\Filament\ContestAdmin\Resources\MfsManualTransactions\MfsManualTransactionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMfsManualTransactions extends ListRecords
{
    protected static string $resource = MfsManualTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
