<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\InternalContestRegistrationResource;
use App\Filament\Widgets\InternalContests\InternalContestRegistrationStats;
use App\Filament\Widgets\InternalContests\InternalContestSectionChart;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ManageRelatedRecords;
use Filament\Tables\Table;

class ManageInternalContestRegistration extends ManageRelatedRecords
{
    protected static string $resource = InternalContestResource::class;

    protected static string $relationship = 'registrations';

    protected static ?string $relatedResource = InternalContestRegistrationResource::class;

    public function table(Table $table): Table
    {
        return $table
            ->headerActions([
                CreateAction::make(),
            ]);
    }

    protected function getHeaderWidgets(): array
    {
        return [
            InternalContestSectionChart::make(['record' => $this->getOwnerRecord()]),
            InternalContestRegistrationStats::make(['record' => $this->getOwnerRecord()]),
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return [
            'md' => 2,
            'xl' => 3,
        ];
    }
}
