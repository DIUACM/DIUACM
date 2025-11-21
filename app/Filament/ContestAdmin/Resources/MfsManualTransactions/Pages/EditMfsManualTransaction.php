<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions\Pages;

use App\Filament\ContestAdmin\Resources\MfsManualTransactions\MfsManualTransactionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditMfsManualTransaction extends EditRecord
{
    protected static string $resource = MfsManualTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
