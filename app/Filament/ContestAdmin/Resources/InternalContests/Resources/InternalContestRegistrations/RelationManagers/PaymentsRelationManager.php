<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\RelationManagers;

use App\Enums\PaymentStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PaymentsRelationManager extends RelationManager
{
    protected static string $relationship = 'payments';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Payment Details')
                    ->schema([
                        TextInput::make('transaction_id')
                            ->label('Transaction ID')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->columnSpan(1),

                        TextInput::make('gateway')
                            ->label('Payment Gateway')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('e.g., bKash, Nagad, Stripe')
                            ->columnSpan(1),

                        TextInput::make('gateway_transaction_id')
                            ->label('Gateway Transaction ID')
                            ->maxLength(255)
                            ->placeholder('Transaction ID from payment gateway')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Amount & Currency')
                    ->schema([
                        TextInput::make('amount')
                            ->label('Amount')
                            ->required()
                            ->numeric()
                            ->prefix('৳')
                            ->minValue(0)
                            ->step(0.01)
                            ->columnSpan(1),

                        TextInput::make('currency')
                            ->label('Currency')
                            ->default('BDT')
                            ->required()
                            ->maxLength(3)
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Status & Response')
                    ->schema([
                        Select::make('status')
                            ->label('Payment Status')
                            ->options(PaymentStatus::class)
                            ->default(PaymentStatus::PENDING)
                            ->required()
                            ->native(false)
                            ->columnSpan(1),

                        DateTimePicker::make('paid_at')
                            ->label('Paid At')
                            ->seconds(false)
                            ->displayFormat('M j, Y g:i A')
                            ->timezone('Asia/Dhaka')
                            ->native(false)
                            ->columnSpan(1),

                        Textarea::make('gateway_response')
                            ->label('Gateway Response (JSON)')
                            ->rows(3)
                            ->columnSpanFull()
                            ->helperText('Raw JSON response from payment gateway')
                            ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : $state)
                            ->dehydrateStateUsing(fn ($state) => is_string($state) && ! empty($state) ? json_decode($state, true) : $state),
                    ])
                    ->columns(2),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('transaction_id')
            ->columns([
                TextColumn::make('transaction_id')
                    ->label('Transaction ID')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->weight('medium'),

                TextColumn::make('gateway')
                    ->label('Gateway')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),

                TextColumn::make('amount')
                    ->label('Amount')
                    ->money('BDT')
                    ->sortable(),

                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->colors([
                        'warning' => PaymentStatus::PENDING->value,
                        'success' => PaymentStatus::PAID->value,
                        'danger' => PaymentStatus::FAILED->value,
                        'gray' => PaymentStatus::REFUNDED->value,
                    ])
                    ->sortable(),

                TextColumn::make('paid_at')
                    ->label('Paid At')
                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka')
                    ->sortable()
                    ->placeholder('Not paid yet'),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(PaymentStatus::class)
                    ->native(false),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
