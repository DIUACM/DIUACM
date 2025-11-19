<?php

namespace App\Filament\ContestAdmin\Resources\Payments\Schemas;

use App\Enums\PaymentStatus;
use App\Models\InternalContestRegistration;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\MorphToSelect;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PaymentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Payment Information')
                 ->columnSpanFull()
                    ->schema([
                        MorphToSelect::make('payable')
                            ->label('Related To')
                            ->required()
                            ->types([
                                MorphToSelect\Type::make(InternalContestRegistration::class)
                                    ->label('Internal Contest Registration')
                                    ->titleAttribute('name')
                                    ->getOptionLabelFromRecordUsing(fn (InternalContestRegistration $record): string => "{$record->name} ({$record->student_id}) - {$record->internalContest->title}"),
                            ])
                            ->searchable()
                            ->preload()
                            ->native(false),
                    ]),

                Section::make('Transaction Details')
                 ->columnSpanFull()
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('gateway')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., bKash, Nagad, SSL Commerce')
                                    ->helperText('Payment gateway used for this transaction'),
                                Select::make('status')
                                    ->options(PaymentStatus::class)
                                    ->required()
                                    ->native(false)
                                    ->default(PaymentStatus::PENDING),
                            ]),
                        Grid::make(2)
                            ->schema([
                                TextInput::make('transaction_id')
                                    ->label('Transaction ID')
                                    ->required()
                                    ->unique(ignoreRecord: true)
                                    ->maxLength(255)
                                    ->helperText('Internal transaction identifier'),
                                TextInput::make('gateway_transaction_id')
                                    ->label('Gateway Transaction ID')
                                    ->maxLength(255)
                                    ->helperText('Transaction ID from payment gateway'),
                            ]),
                        Grid::make(2)
                            ->schema([
                                TextInput::make('amount')
                                    ->required()
                                    ->numeric()
                                    ->minValue(0)
                                    ->step(0.01)
                                    ->prefix('৳')
                                    ->helperText('Payment amount'),
                                TextInput::make('currency')
                                    ->required()
                                    ->maxLength(3)
                                    ->default('BDT')
                                    ->placeholder('BDT')
                                    ->helperText('Currency code (ISO 4217)'),
                            ]),
                        DateTimePicker::make('paid_at')
                            ->label('Payment Date')
                            ->seconds(false)
                            ->displayFormat('M j, Y g:i A')
                            ->timezone('Asia/Dhaka')
                            ->native(false)
                            ->helperText('When the payment was completed'),
                    ]),

                Section::make('Gateway Response')
                 ->columnSpanFull()
                    ->description('Response data from the payment gateway')
                    ->schema([
                        Textarea::make('gateway_response')
                            ->label('Gateway Response')
                            ->rows(6)
                            ->columnSpanFull()
                            ->helperText('JSON response from payment gateway (will be stored as JSON)')
                            ->placeholder('Paste JSON response here...'),
                    ])
                    ->collapsible()
                    ->collapsed(),
            ]);
    }
}
