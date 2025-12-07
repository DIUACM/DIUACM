<?php

namespace App\Filament\Resources\JobExperiences;

use App\Filament\Resources\JobExperiences\Pages\CreateJobExperience;
use App\Filament\Resources\JobExperiences\Pages\EditJobExperience;
use App\Filament\Resources\JobExperiences\Pages\ListJobExperiences;
use App\Filament\Resources\JobExperiences\Schemas\JobExperienceForm;
use App\Filament\Resources\JobExperiences\Tables\JobExperiencesTable;
use App\Models\JobExperience;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class JobExperienceResource extends Resource
{
    protected static ?string $model = JobExperience::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBriefcase;

    protected static ?string $navigationLabel = 'Job Experiences';

    protected static ?string $modelLabel = 'Job Experience';

    protected static ?int $navigationSort = 5;

    public static function form(Schema $schema): Schema
    {
        return JobExperienceForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return JobExperiencesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListJobExperiences::route('/'),
            'create' => CreateJobExperience::route('/create'),
            'edit' => EditJobExperience::route('/{record}/edit'),
        ];
    }
}
