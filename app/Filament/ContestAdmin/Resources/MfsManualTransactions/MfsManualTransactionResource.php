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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MfsManualTransactionResource extends Resource
{
    protected static ?string $model = MfsManualTransaction::class;

    protected static ?string $slug = 'mfs-transactions';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBanknotes;


    protected static ?string $recordTitleAttribute = 'mfs_transaction_id';

    protected static ?string $navigationLabel = 'MFS Transactions';

    protected static ?string $modelLabel = 'MFS Transaction';

    protected static ?string $pluralModelLabel = 'MFS Transactions';

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::whereIn('status', ['pending', 'verified'])->count();
    }

    public static function getGlobalSearchEloquentQuery(): Builder
    {
        return parent::getGlobalSearchEloquentQuery()->with('payment');
    }

    public static function getGloballySearchableAttributes(): array
    {
        return ['mfs_transaction_id', 'sender_number', 'payment.transaction_id'];
    }

    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return [
            'MFS Provider' => $record->mfs_type->getLabel(),
            'Status' => $record->status->getLabel(),
            'Amount' => '৳'.number_format($record->amount, 2),
        ];
    }

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
