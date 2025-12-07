<?php

namespace App\Filament\Resources\JobExperiences\Schemas;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JobExperienceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('User Information')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('user_id')
                            ->label('User')
                            ->relationship('user', 'name')
                            ->searchable(['name', 'username', 'student_id'])
                            ->preload()
                            ->required()
                            ->helperText('Select the user this job experience belongs to'),
                    ]),

                Section::make('Job Details')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('company_name')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., Google, Microsoft'),

                                TextInput::make('position')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., Software Engineer'),
                            ]),

                        Grid::make()
                            ->schema([
                                TextInput::make('location')
                                    ->maxLength(255)
                                    ->placeholder('e.g., San Francisco, CA'),

                                TextInput::make('company_website')
                                    ->url()
                                    ->maxLength(255)
                                    ->placeholder('https://example.com'),
                            ]),

                        MarkdownEditor::make('description')
                            ->placeholder('Describe your role, responsibilities, and achievements')
                            ->columnSpanFull(),
                    ]),

                Section::make('Duration')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                DatePicker::make('start_date')
                                    ->required()
                                    ->displayFormat('M Y')
                                    ->native(false),

                                DatePicker::make('end_date')
                                    ->displayFormat('M Y')
                                    ->native(false)
                                    ->hidden(fn ($get) => $get('is_current'))
                                    ->required(fn ($get) => ! $get('is_current')),

                                Checkbox::make('is_current')
                                    ->label('I currently work here')
                                    ->live()
                                    ->afterStateUpdated(fn ($state, $set) => $state ? $set('end_date', null) : null),
                            ]),
                    ]),

                Section::make('Images')
                    ->columnSpanFull()
                    ->schema([
                        SpatieMediaLibraryFileUpload::make('images')
                            ->collection('images')
                            ->helperText('Upload job experience related images (JPEG, PNG, WebP, max 10MB each)')
                            ->visibility('public')
                            ->image()
                            ->imageEditor()
                            ->panelLayout('grid')
                            ->multiple()
                            ->reorderable()
                            ->appendFiles()
                            ->openable()
                            ->downloadable()
                            ->maxFiles(6)
                            ->maxSize(10240)
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp']),
                    ]),
            ]);
    }
}
