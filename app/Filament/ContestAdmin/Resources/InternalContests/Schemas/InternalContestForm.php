<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class InternalContestForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make()
                    ->columnSpanFull()
                    ->tabs([
                        Tabs\Tab::make('Basic Information')
                            ->icon('heroicon-o-information-circle')
                            ->schema([
                                Section::make('Event Details')
                                    ->schema([
                                        Grid::make(3)
                                            ->schema([
                                                TextInput::make('title')
                                                    ->required()
                                                    ->live(onBlur: true)
                                                    ->afterStateUpdated(fn ($state, callable $set) => $set('slug', Str::slug($state)))
                                                    ->columnSpan(2)
                                                    ->maxLength(255),
                                                TextInput::make('semester')
                                                    ->required()
                                                    ->placeholder('e.g., Fall 2024, Spring 2025')
                                                    ->columnSpan(1)
                                                    ->maxLength(255),
                                            ]),
                                        TextInput::make('slug')
                                            ->required()
                                            ->unique(ignoreRecord: true)
                                            ->maxLength(255)
                                            ->helperText('Auto-generated from title, but you can customize it'),
                                        RichEditor::make('description')
                                            ->toolbarButtons([
                                                'bold',
                                                'italic',
                                                'underline',
                                                'strike',
                                                'link',
                                                'bulletList',
                                                'orderedList',
                                                'h2',
                                                'h3',
                                                'blockquote',
                                                'codeBlock',
                                            ])
                                            ->columnSpanFull(),
                                    ])
                                    ->columns(1),

                                Section::make('Media & Assets')
                                    ->description('Upload banner and size guideline images')
                                    ->schema([
                                        SpatieMediaLibraryFileUpload::make('banner_image')
                                            ->label('Banner Image')
                                            ->collection('banner_image')
                                            ->image()
                                            ->imageEditor()
                                            ->openable()
                                            ->imageEditorAspectRatios([
                                                '10:7',
                                                '16:9',
                                                '4:3',
                                            ])
                                            ->visibility(visibility: 'public')
                                            ->helperText('Recommended size: 1000x700px (10:7 aspect ratio)')
                                            ->maxSize(5120),
                                        SpatieMediaLibraryFileUpload::make('tshirt_size_guideline')
                                            ->label('T-shirt Size Guideline')
                                            ->collection('tshirt_size_guideline')
                                            ->image()
                                            ->imageEditor()
                                            ->openable()
                                            ->visibility(visibility: 'public')
                                            ->helperText('Upload a size chart to help participants choose their size')
                                            ->maxSize(5120),
                                    ])
                                    ->columns(2)
                                    ->collapsible(),
                            ]),

                        Tabs\Tab::make('Registration Settings')
                            ->icon('heroicon-o-ticket')
                            ->schema([
                                Section::make('Registration Period')
                                    ->description('Define when registration opens and closes')
                                    ->schema([
                                        DateTimePicker::make('registration_start_time')
                                            ->seconds(false)
                                            ->displayFormat('M j, Y g:i A')
                                            ->timezone('Asia/Dhaka')
                                            ->label('Registration Start')
                                            ->required()
                                            ->native(false),
                                        DateTimePicker::make('registration_deadline')
                                            ->seconds(false)
                                            ->displayFormat('M j, Y g:i A')
                                            ->timezone('Asia/Dhaka')
                                            ->label('Registration Deadline')
                                            ->after('registration_start_time')
                                            ->required()
                                            ->native(false),
                                    ])
                                    ->columns(2),

                                Section::make('Registration Limits & Fees')
                                    ->schema([
                                        Grid::make(3)
                                            ->schema([
                                                TextInput::make('registration_limit')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->placeholder('Unlimited')
                                                    ->label('Registration Limit')
                                                    ->helperText('Leave empty for unlimited registrations')
                                                    ->columnSpan(1),
                                                TextInput::make('registration_fee')
                                                    ->numeric()
                                                    ->prefix('৳')
                                                    ->minValue(0)
                                                    ->default(0)
                                                    ->required()
                                                    ->label('Registration Fee')
                                                    ->helperText('Enter 0 for free events')
                                                    ->columnSpan(1),
                                                Select::make('status')
                                                    ->required()
                                                    ->options([
                                                        'draft' => 'Draft',
                                                        'published' => 'Published',
                                                        'closed' => 'Closed',
                                                    ])
                                                    ->default('draft')
                                                    ->native(false)
                                                    ->columnSpan(1),
                                            ]),
                                    ]),
                            ]),

                        Tabs\Tab::make('Form Configuration')
                            ->icon('heroicon-o-adjustments-horizontal')
                            ->schema([
                                Section::make('Student ID Validation')
                                    ->description('Configure how student IDs should be validated')
                                    ->schema([
                                        TextInput::make('student_id_rules')
                                            ->label('Validation Rules (Regex)')
                                            ->placeholder('regex:/^[0-9]{3}-[0-9]{2}-[0-9]{4}$/')
                                            ->helperText('Enter a regex pattern to validate student IDs'),
                                        TextInput::make('student_id_rules_guide')
                                            ->label('Instructions for Students')
                                            ->placeholder('Format: XXX-XX-XXXX (e.g., 123-45-6789)')
                                            ->helperText('This message will be shown to students on the registration form'),
                                    ])
                                    ->columns(2)
                                    ->collapsible(),

                                Section::make('Pickup Points')
                                    ->description('Define locations where participants can collect items')
                                    ->schema([
                                        Repeater::make('pickup_points')
                                            ->label('')
                                            ->grid(3)
                                            ->reorderable()
                                            ->simple(
                                                TextInput::make('name')
                                                    ->hiddenLabel()
                                                    ->required()
                                                    ->placeholder('e.g., Main Campus Office, SAC Building')
                                            )
                                            ->addActionLabel('Add Pickup Point')
                                            ->defaultItems(0),
                                    ])
                                    ->collapsible()
                                    ->collapsed(),

                                Section::make('Department & Section Options')
                                    ->description('Available departments and sections for registration')
                                    ->schema([
                                        Repeater::make('departments')
                                            ->label('Departments')
                                            ->grid(4)
                                            ->reorderable()
                                            ->simple(
                                                TextInput::make('name')
                                                    ->hiddenLabel()
                                                    ->required()
                                                    ->placeholder('e.g., CSE, EEE, BBA')
                                            )
                                            ->addActionLabel('Add Department')
                                            ->defaultItems(0),
                                        Repeater::make('sections')
                                            ->label('Sections')
                                            ->grid(6)
                                            ->reorderable()
                                            ->simple(
                                                TextInput::make('name')
                                                    ->hiddenLabel()
                                                    ->required()
                                                    ->placeholder('e.g., A, B, C')
                                            )
                                            ->addActionLabel('Add Section')
                                            ->defaultItems(0),
                                    ])
                                    ->columns(1)
                                    ->collapsible()
                                    ->collapsed(),

                                Section::make('Lab Teachers')
                                    ->description('Lab teacher information for registration')
                                    ->schema([
                                        Repeater::make('lab_teacher_names')
                                            ->label('')
                                            ->grid(2)
                                            ->reorderable()
                                            ->schema([
                                                TextInput::make('initial')
                                                    ->label('Initial')
                                                    ->required()
                                                    ->placeholder('e.g., ABC'),
                                                TextInput::make('full_name')
                                                    ->label('Full Name')
                                                    ->required()
                                                    ->placeholder('e.g., Dr. John Doe'),
                                            ])
                                            ->addActionLabel('Add Teacher')
                                            ->defaultItems(0)
                                            ->columns(2),
                                    ])
                                    ->collapsible()
                                    ->collapsed(),

                                Section::make('T-shirt Sizes')
                                    ->description('Available t-shirt sizes for this event')
                                    ->schema([
                                        Repeater::make('tshirt_sizes')
                                            ->label('')
                                            ->grid(5)
                                            ->reorderable()
                                            ->simple(
                                                TextInput::make('size')
                                                    ->hiddenLabel()
                                                    ->placeholder('e.g., XS, S, M, L, XL')
                                                    ->required()
                                            )
                                            ->addActionLabel('Add Size')
                                            ->helperText('Leave empty to use default sizes: XS, S, M, L, XL, XXL, XXXL')
                                            ->defaultItems(0),
                                    ])
                                    ->collapsible()
                                    ->collapsed(),
                            ]),
                    ]),
            ]);
    }
}
