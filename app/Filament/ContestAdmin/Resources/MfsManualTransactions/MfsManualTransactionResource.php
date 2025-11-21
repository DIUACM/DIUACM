<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions;

use App\Filament\ContestAdmin\Resources\MfsManualTransactions\Pages\CreateMfsManualTransaction;
use App\Filament\ContestAdmin\Resources\MfsManualTransactions\Pages\EditMfsManualTransaction;
use App\Filament\ContestAdmin\Resources\MfsManualTransactions\Pages\ListMfsManualTransactions;
use App\Filament\ContestAdmin\Resources\MfsManualTransactions\Schemas\MfsManualTransactionForm;
use App\Filament\ContestAdmin\Resources\MfsManualTransactions\Tables\MfsManualTransactionsTable;
use App\Models\MfsManualTransaction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class MfsManualTransactionResource extends Resource
{
    protected static ?string $model = MfsManualTransaction::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return MfsManualTransactionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MfsManualTransactionsTable::configure($table);
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
            'index' => ListMfsManualTransactions::route('/'),
            'create' => CreateMfsManualTransaction::route('/create'),
            'edit' => EditMfsManualTransaction::route('/{record}/edit'),
        ];
    }
}
