<?php

namespace App\Filament\Resources\Trackers\Resources\RankLists;

use App\Filament\Resources\Trackers\Resources\RankLists\Pages\CreateRankList;
use App\Filament\Resources\Trackers\Resources\RankLists\Pages\EditRankList;
use App\Filament\Resources\Trackers\Resources\RankLists\Schemas\RankListForm;
use App\Filament\Resources\Trackers\Resources\RankLists\Tables\RankListsTable;
use App\Filament\Resources\Trackers\TrackerResource;
use App\Models\RankList;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class RankListResource extends Resource
{
    protected static ?string $model = RankList::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $parentResource = TrackerResource::class;

    protected static ?string $recordTitleAttribute = 'keyword';

    public static function form(Schema $schema): Schema
    {
        return RankListForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return RankListsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\EventsRelationManager::class,
            RelationManagers\UsersRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'create' => CreateRankList::route('/create'),
            'edit' => EditRankList::route('/{record}/edit'),
        ];
    }
}
