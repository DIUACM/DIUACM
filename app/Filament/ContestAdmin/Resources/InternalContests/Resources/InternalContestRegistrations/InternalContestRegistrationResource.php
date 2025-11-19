<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations;

use App\Filament\ContestAdmin\Resources\InternalContests\InternalContestResource;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Pages\CreateInternalContestRegistration;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Pages\EditInternalContestRegistration;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Schemas\InternalContestRegistrationForm;
use App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Tables\InternalContestRegistrationsTable;
use App\Models\InternalContestRegistration;
use BackedEnum;
use Filament\Resources\ParentResourceRegistration;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class InternalContestRegistrationResource extends Resource
{
    protected static ?string $model = InternalContestRegistration::class;

    protected static ?string $slug = 'registrations';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationLabel = 'Registrations';

    protected static ?string $modelLabel = 'Registration';

    protected static ?string $pluralModelLabel = 'Registrations';

    public static function getParentResourceRegistration(): ?ParentResourceRegistration
    {
        return InternalContestResource::asParent()
            ->relationship('registrations')
            ->inverseRelationship('internalContest');
    }

    public static function form(Schema $schema): Schema
    {
        return InternalContestRegistrationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return InternalContestRegistrationsTable::configure($table);
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
            'create' => CreateInternalContestRegistration::route('/create'),
            'edit' => EditInternalContestRegistration::route('/{record}/edit'),
        ];
    }
}
