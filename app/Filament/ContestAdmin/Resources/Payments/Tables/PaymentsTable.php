<?php

namespace App\Filament\ContestAdmin\Resources\Payments\Tables;

use App\Enums\PaymentStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PaymentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('transaction_id')
                    ->label('Transaction ID')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->copyMessage('Transaction ID copied')
                    ->weight('medium'),
                TextColumn::make('payable_type')
                    ->label('Type')
                    ->formatStateUsing(fn (string $state): string => class_basename($state))
                    ->badge()
                    ->color('gray')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('payable_id')
                    ->label('Payable ID')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('gateway')
                    ->label('Gateway')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                TextColumn::make('amount')
                    ->money('BDT')
                    ->sortable()
                    ->weight('semibold'),
                TextColumn::make('status')
                    ->badge()
                    ->searchable()
                    ->sortable(),
                TextColumn::make('gateway_transaction_id')
                    ->label('Gateway Txn ID')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Gateway transaction ID copied')
                    ->toggleable()
                    ->placeholder('—'),
                TextColumn::make('paid_at')
                    ->label('Payment Date')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable()
                    ->placeholder('Not paid'),
                TextColumn::make('created_at')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(PaymentStatus::class)
                    ->native(false)
                    ->multiple(),
                SelectFilter::make('gateway')
                    ->options([
                        'bKash' => 'bKash',
                        'Nagad' => 'Nagad',
                        'SSL Commerce' => 'SSL Commerce',
                        'Manual' => 'Manual',
                    ])
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
