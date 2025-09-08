<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Enums\Gender;
use App\Models\User;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic Information')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('name')
                                    ->required(),
                                TextInput::make('username')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                            ]),

                        Grid::make()
                            ->schema([
                                TextInput::make('email')
                                    ->label('Email address')
                                    ->email()
                                    ->unique(ignoreRecord: true)
                                    ->required(),
                                Select::make('gender')
                                    ->options(Gender::class),
                                TextInput::make('phone')
                                    ->tel(),
                            ]),

                        Grid::make()
                            ->schema([
                                FileUpload::make('image')
                                    ->disk('public')
                                    ->directory('profile-images')
                                    ->visibility('public')
                                    ->avatar()
                                    ->imageEditor()
                                    ->image(),
                                DateTimePicker::make('email_verified_at')
                                    ->label('Email verified at')
                                    ->seconds(false)
                                    ->displayFormat('M j, Y g:i A')
                                    ->timezone('Asia/Dhaka'),
                                TextInput::make('password')
                                    ->password()
                                    ->revealable()
                                    ->dehydrated(fn ($state) => filled($state))
                                    ->required(fn (?User $record): bool => $record === null),
                            ]),
                    ]),

                Section::make('Competitive Profiles')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('codeforces_handle')
                                    ->label('Codeforces')
                                    ->prefix('@'),
                                TextInput::make('atcoder_handle')
                                    ->label('AtCoder')
                                    ->prefix('@'),
                                TextInput::make('vjudge_handle')
                                    ->label('VJudge')
                                    ->prefix('@'),
                            ]),

                        Grid::make()
                            ->schema([
                                TextInput::make('max_cf_rating')
                                    ->label('Max CF rating')
                                    ->numeric()
                                    ->default(-1)
                                    ->helperText('Use -1 if unknown'),
                            ]),
                    ]),

                Section::make('Academic Information')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('department'),
                                TextInput::make('student_id')
                                    ->label('Student ID'),
                            ]),
                    ]),

                Section::make('Account History')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextEntry::make('created_at')
                                    ->label('Created Date')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                                TextEntry::make('updated_at')
                                    ->label('Last Modified Date')
                                    ->dateTime('M j, Y g:i A', timezone: 'Asia/Dhaka'),
                            ]),
                    ])
                    ->collapsed()
                    ->hiddenOn('create'),
            ]);
    }
}
