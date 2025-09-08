<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists\Pages;

use App\Filament\Resources\Trackers\Resources\RankLists\RankListResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditRankList extends EditRecord
{
    protected static string $resource = RankListResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
    public function hasCombinedRelationManagerTabsWithContent(): bool
    {
        return true;
    }
}
