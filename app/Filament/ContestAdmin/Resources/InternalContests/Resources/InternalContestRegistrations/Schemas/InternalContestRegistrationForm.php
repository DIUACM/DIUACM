<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Schemas;

use App\Enums\Gender;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class InternalContestRegistrationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('User Account')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('user_id')
                            ->label('User Account')
                            ->relationship('user', 'name')
                            ->searchable(['name', 'email'])
                            ->preload()
                            ->required()
                            ->helperText('Link to existing user account')
                            ->columnSpanFull(),
                    ]),

                Section::make('Personal Information')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        TextInput::make('email')
                            ->label('Email Address')
                            ->email()
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        TextInput::make('student_id')
                            ->label('Student ID')
                            ->required()
                            ->maxLength(255)
                            ->helperText('University student ID number')
                            ->columnSpan(1),

                        TextInput::make('phone')
                            ->label('Phone Number')
                            ->tel()
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        Select::make('gender')
                            ->options(Gender::class)
                            ->required()
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Academic Details')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('department')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        TextInput::make('section')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(1),

                        TextInput::make('lab_teacher_name')
                            ->label('Lab Teacher Name')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Contest Preferences')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('tshirt_size')
                            ->label('T-Shirt Size')
                            ->required()
                            ->maxLength(255)
                            ->helperText('e.g., S, M, L, XL, XXL')
                            ->columnSpan(1),

                        Toggle::make('transport_service_required')
                            ->label('Transport Service Required')
                            ->live()
                            ->columnSpan(1),

                        TextInput::make('pickup_point')
                            ->label('Pickup Point')
                            ->maxLength(255)
                            ->visible(fn ($get) => $get('transport_service_required'))
                            ->required(fn ($get) => $get('transport_service_required'))
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Metadata')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextEntry::make('created_at')
                                    ->label('Registered At')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                                TextEntry::make('updated_at')
                                    ->label('Last Updated')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                            ]),
                    ])
                    ->collapsed()
                    ->hiddenOn('create'),
            ]);
    }
}
