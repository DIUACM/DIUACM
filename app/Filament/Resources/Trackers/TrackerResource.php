<?php

namespace App\Filament\Resources\Trackers;

use App\Filament\Resources\Trackers\Pages\CreateTracker;
use App\Filament\Resources\Trackers\Pages\EditTracker;
use App\Filament\Resources\Trackers\Pages\ListTrackers;
use App\Filament\Resources\Trackers\Schemas\TrackerForm;
use App\Filament\Resources\Trackers\Tables\TrackersTable;
use App\Models\Tracker;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TrackerResource extends Resource
{
    protected static ?string $model = Tracker::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Schema $schema): Schema
    {
        return TrackerForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TrackersTable::configure($table);
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
            'index' => ListTrackers::route('/'),
            'create' => CreateTracker::route('/create'),
            'edit' => EditTracker::route('/{record}/edit'),
        ];
    }
}
