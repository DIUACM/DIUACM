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

class ContestResource extends Resource
{
    protected static ?string $model = Contest::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

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
        ];
    }
}
