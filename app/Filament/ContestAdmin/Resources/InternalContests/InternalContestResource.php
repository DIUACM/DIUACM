<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests;

use App\Filament\ContestAdmin\Resources\InternalContests\Pages\CreateInternalContest;
use App\Filament\ContestAdmin\Resources\InternalContests\Pages\EditInternalContest;
use App\Filament\ContestAdmin\Resources\InternalContests\Pages\ListInternalContests;
use App\Filament\ContestAdmin\Resources\InternalContests\Pages\ManageInternalContestRegistration;
use App\Filament\ContestAdmin\Resources\InternalContests\Schemas\InternalContestForm;
use App\Filament\ContestAdmin\Resources\InternalContests\Tables\InternalContestsTable;
use App\Models\InternalContest;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class InternalContestResource extends Resource
{
    protected static ?string $model = InternalContest::class;

    protected static ?string $slug = 'contests';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTicket;

    protected static ?int $navigationSort = 3;

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?string $navigationLabel = 'Contests';

    protected static ?string $modelLabel = 'Contest';

    protected static ?string $pluralModelLabel = 'Contests';

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    public static function getGlobalSearchEloquentQuery(): Builder
    {
        return parent::getGlobalSearchEloquentQuery();
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['title', 'slug', 'semester', 'description'];
    }

    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return [
            'Semester' => $record->semester,
            'Status' => ucfirst($record->status),
            'Deadline' => optional($record->registration_deadline)->format('M j, Y g:i A'),
        ];
    }

    public static function form(Schema $schema): Schema
    {
        return InternalContestForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return InternalContestsTable::configure($table);
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
            'index' => ListInternalContests::route('/'),
            'create' => CreateInternalContest::route('/create'),
            'edit' => EditInternalContest::route('/{record}/edit'),
            'registrations' => ManageInternalContestRegistration::route('/{record}/registrations'),

        ];
    }
}
