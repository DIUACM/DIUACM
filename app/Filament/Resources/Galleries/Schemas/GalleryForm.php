<?php

namespace App\Filament\Resources\Galleries\Schemas;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class GalleryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Gallery Details')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                TextInput::make('title')
                                    ->label('Title')
                                    ->maxLength(120)
                                    ->required()
                                    ->autocomplete(false)
                                    ->placeholder('Enter a concise gallery title')
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(function (string $operation, $state, $set) {
                                        if ($operation !== 'create') {
                                            return;
                                        }
                                        $set('slug', \Illuminate\Support\Str::slug($state));
                                    }),
                                TextInput::make('slug')
                                    ->label('Slug')
                                    ->required()
                                    ->unique(ignoreRecord: true)
                                    ->maxLength(255)
                                    ->autocomplete(false)
                                    ->placeholder('auto-generated-from-title')
                                    ->helperText('URL-friendly version of the title. Auto-generated but can be customized.'),
                                ToggleButtons::make('status')
                                    ->options(VisibilityStatus::class)
                                    ->default(VisibilityStatus::DRAFT)
                                    ->inline()
                                    ->required()
                                    ->helperText('Set to Draft while preparing; Published makes it visible.'),
                            ]),
                        Grid::make()
                            ->schema([
                                Textarea::make('description')
                                    ->label('Description')
                                    ->rows(5)
                                    ->maxLength(1000)
                                    ->placeholder('Optional description of this gallery')
                                    ->columnSpanFull(),
                            ]),
                    ]),
                Section::make('Images')
                    ->columnSpanFull()
                    ->schema([
                        SpatieMediaLibraryFileUpload::make('gallery_images')

                            ->collection('gallery_images')
                            ->helperText('Upload up to 12 images (JPEG, PNG, WebP, max 2MB each). Drag to reorder.')
                            ->visibility('public')
                            ->image()
                            ->imageEditor()
                            ->panelLayout('grid')
                            ->multiple()
                            ->reorderable()
                            ->appendFiles()
                            ->openable()
                            ->downloadable()
                            ->maxFiles(12)
                            ->maxSize(2048)
                            ->acceptedFileTypes(types: ['image/jpeg', 'image/png', 'image/webp'])
                            ->columnSpanFull(),
                    ]),
                Section::make('Gallery History')
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
