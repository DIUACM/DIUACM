<?php

namespace App\Filament\ContestAdmin\Resources\MfsManualTransactions\Tables;

use App\Enums\MfsTransactionStatus;
use App\Enums\MfsType;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MfsManualTransactionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('payment.transaction_id')
                    ->label('Payment Txn ID')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->copyMessage('Payment transaction ID copied')
                    ->weight('medium'),
                TextColumn::make('mfs_type')
                    ->label('MFS Provider')
                    ->badge()
                    ->searchable()
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->searchable()
                    ->sortable(),
                TextColumn::make('sender_number')
                    ->label('Sender Number')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Number copied'),
                TextColumn::make('mfs_transaction_id')
                    ->label('MFS Txn ID')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('MFS transaction ID copied')
                    ->weight('medium'),
                TextColumn::make('amount')
                    ->label('Amount')
                    ->money('BDT')
                    ->sortable()
                    ->weight('semibold'),
                TextColumn::make('created_at')
                    ->label('Submitted At')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Verification Status')
                    ->options(MfsTransactionStatus::class)
                    ->native(false)
                    ->multiple(),
                SelectFilter::make('mfs_type')
                    ->label('MFS Provider')
                    ->options(MfsType::class)
                    ->native(false)
                    ->multiple(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
