<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Pages;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\InternalContestRegistrationResource;
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
}
