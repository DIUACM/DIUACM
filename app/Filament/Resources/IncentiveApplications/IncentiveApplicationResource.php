<?php

namespace App\Filament\Resources\IncentiveApplications;

use App\Filament\Resources\IncentiveApplications\Pages\EditIncentiveApplication;
use App\Filament\Resources\IncentiveApplications\Pages\ListIncentiveApplications;
use App\Filament\Resources\IncentiveApplications\Pages\ViewIncentiveApplication;
use App\Filament\Resources\IncentiveApplications\Schemas\IncentiveApplicationForm;
use App\Filament\Resources\IncentiveApplications\Tables\IncentiveApplicationsTable;
use App\Models\IncentiveApplication;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class IncentiveApplicationResource extends Resource
{
    protected static ?string $model = IncentiveApplication::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?string $recordTitleAttribute = 'full_name';

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['full_name', 'email', 'student_id', 'phone_number', 'batch'];
    }

    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return [
            'Student ID' => $record->student_id,
            'Email' => $record->email,
            'Batch' => $record->batch,
        ];
    }

    public static function form(Schema $schema): Schema
    {
        return IncentiveApplicationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return IncentiveApplicationsTable::configure($table);
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
            'index' => ListIncentiveApplications::route('/'),
            'view' => ViewIncentiveApplication::route('/{record}'),
            'edit' => EditIncentiveApplication::route('/{record}/edit'),
        ];
    }
}
