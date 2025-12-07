<?php

namespace App\Filament\Resources\JobExperiences\Pages;

use App\Filament\Resources\JobExperiences\JobExperienceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListJobExperiences extends ListRecords
{
    protected static string $resource = JobExperienceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
