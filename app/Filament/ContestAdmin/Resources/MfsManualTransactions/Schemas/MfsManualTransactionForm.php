<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions\Schemas;

use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class MfsManualTransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('payment_id')
                    ->relationship('payment', 'id')
                    ->required(),
                Select::make('status')
                    ->options(MfsTransactionStatus::class)
                    ->default('pending')
                    ->required(),
                TextInput::make('sender_number')
                    ->required(),
                TextInput::make('mfs_transaction_id')
                    ->required(),
                Select::make('mfs_type')
                    ->options(MfsType::class)
                    ->required(),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
            ]);
    }
}
