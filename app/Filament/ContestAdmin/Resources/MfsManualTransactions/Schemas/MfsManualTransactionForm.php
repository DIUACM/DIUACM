<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions\Schemas;

use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use App\Models\Payment;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class MfsManualTransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Payment Reference')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('payment_id')
                            ->label('Payment')
                            ->relationship('payment', 'transaction_id')
                            ->getOptionLabelFromRecordUsing(fn (Payment $record): string => "{$record->transaction_id} - ৳{$record->amount} ({$record->status->getLabel()})")
                            ->searchable(['transaction_id', 'gateway_transaction_id'])
                            ->preload()
                            ->required()
                            ->native(false)
                            ->helperText('Select the payment this MFS transaction is for'),
                    ]),

                Section::make('MFS Transaction Details')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                ToggleButtons::make('mfs_type')
                                    ->label('MFS Provider')
                                    ->options(MfsType::class)
                                    ->required()
                                    ->inline()
                                    ->helperText('Mobile financial service provider'),
                                ToggleButtons::make('status')
                                    ->label('Verification Status')
                                    ->options(MfsTransactionStatus::class)
                                    ->default(MfsTransactionStatus::PENDING)
                                    ->required()
                                    ->inline()
                                    ->helperText('Current verification status of this transaction'),
                            ]),
                        Grid::make(2)
                            ->schema([
                                TextInput::make('sender_number')
                                    ->label('Sender Number')
                                    ->tel()
                                    ->required()
                                    ->maxLength(20)
                                    ->placeholder('01XXXXXXXXX')
                                    ->helperText('Mobile number used to send payment'),
                                TextInput::make('receiver_number')
                                    ->label('Receiver Number')
                                    ->tel()
                                    ->required()
                                    ->maxLength(20)
                                    ->placeholder('01XXXXXXXXX')
                                    ->helperText('Mobile number that received the payment'),
                            ]),
                        TextInput::make('mfs_transaction_id')
                            ->label('MFS Transaction ID')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('e.g., BKD12345678')
                            ->helperText('Transaction ID from MFS provider'),
                        TextInput::make('amount')
                            ->label('Transaction Amount')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->step(0.01)
                            ->prefix('৳')
                            ->helperText('Amount sent via MFS'),
                    ]),
            ]);
    }
}
