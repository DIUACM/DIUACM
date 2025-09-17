<?php

namespace App\Filament\Resources\Trackers\Pages;

use App\Filament\Resources\Trackers\Resources\RankLists\RankListResource;
use App\Filament\Resources\Trackers\TrackerResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ManageRelatedRecords;
use Filament\Tables\Table;

class ManageTrackerRankLists extends ManageRelatedRecords
{
    protected static string $resource = TrackerResource::class;

    protected static string $relationship = 'rankLists';

    protected static ?string $relatedResource = RankListResource::class;

    public function table(Table $table): Table
    {
        return $table
            ->headerActions([
                CreateAction::make(),
            ]);
    }
}
