<?php

namespace App\Filament\Resources\Trackers\Pages;

use App\Filament\Resources\Trackers\TrackerResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTracker extends EditRecord
{
    protected static string $resource = TrackerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('rank_lists')
                ->label('Manage Rank Lists')
                ->icon('heroicon-o-rectangle-stack')
                ->url(fn () => TrackerResource::getUrl('rank-lists', ['record' => $this->record])),
            DeleteAction::make(),
        ];
    }
}
