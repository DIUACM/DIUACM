<?php

namespace App\Filament\Resources\IncentiveApplications\Schemas;

use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class IncentiveApplicationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Personal Information')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('full_name')
                                    ->label('Full Name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('student_id')
                                    ->label('Student ID')
                                    ->required()
                                    ->maxLength(255),
                            ]),

                        Grid::make()
                            ->schema([
                                TextInput::make('email')
                                    ->label('Email')
                                    ->email()
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('phone_number')
                                    ->label('Phone Number')
                                    ->tel()
                                    ->required()
                                    ->maxLength(255),
                            ]),

                        Grid::make()
                            ->schema([
                                TextInput::make('batch')
                                    ->label('Batch')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('current_semester')
                                    ->label('Current Semester')
                                    ->required()
                                    ->maxLength(255),
                            ]),

                        Select::make('user_id')
                            ->label('User')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->disabled(),
                    ]),

                Section::make('Courses')
                    ->columnSpanFull()
                    ->schema([
                        Repeater::make('courses')
                            ->label('')
                            ->schema([
                                Grid::make()
                                    ->columns(2)
                                    ->schema([
                                        TextInput::make('course_name')
                                            ->label('Course Name')
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('course_code')
                                            ->label('Course Code')
                                            ->required()
                                            ->maxLength(255),
                                    ]),
                                Grid::make()
                                    ->columns(3)
                                    ->schema([
                                        TextInput::make('teacher_name')
                                            ->label('Teacher Name')
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('teacher_initial')
                                            ->label('Teacher Initial')
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('section')
                                            ->label('Section')
                                            ->required()
                                            ->maxLength(255),
                                    ]),
                                Grid::make()
                                    ->columns(2)
                                    ->schema([
                                        TextInput::make('teacher_email')
                                            ->label('Teacher Email')
                                            ->email()
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('teacher_phone')
                                            ->label('Teacher Phone')
                                            ->tel()
                                            ->required()
                                            ->maxLength(255),
                                    ]),
                            ])
                            ->itemLabel(fn (array $state): ?string => $state['course_name'] ?? null)
                            ->collapsible()
                            ->defaultItems(1)
                            ->minItems(1)
                            ->required(),
                    ]),
            ]);
    }
}
