<?php

namespace App\Filament\Resources\Contests;

use App\Filament\Resources\Contests\Pages\CreateContest;
use App\Filament\Resources\Contests\Pages\EditContest;
use App\Filament\Resources\Contests\Pages\ListContests;
use App\Filament\Resources\Contests\Schemas\ContestForm;
use App\Filament\Resources\Contests\Tables\ContestsTable;
use App\Models\Contest;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ContestResource extends Resource
{
    protected static ?string $model = Contest::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGlobeAlt;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationLabel = 'Contests';

    protected static ?string $modelLabel = 'Contest';

    protected static ?string $pluralModelLabel = 'Contests';

    protected static ?int $navigationSort = 3; // After trackers (which was 2)

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['name', 'location', 'description'];
    }

    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return [
            'Type' => $record->contest_type?->getLabel() ?? $record->contest_type,
            'Location' => $record->location,
            'Teams' => $record->teams_count ?? $record->teams()->count(),
            'Date' => optional($record->date)?->toDateTimeString(),
        ];
    }

    public static function getGlobalSearchEloquentQuery(): Builder
    {
        return parent::getGlobalSearchEloquentQuery()->withCount('teams');
    }

    public static function form(Schema $schema): Schema
    {
        return ContestForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ContestsTable::configure($table);
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
            'index' => ListContests::route('/'),
            'create' => CreateContest::route('/create'),
            'edit' => EditContest::route('/{record}/edit'),
            'teams' => \App\Filament\Resources\Contests\Pages\ManageContestTeams::route('/{record}/teams'),
        ];
    }
}
