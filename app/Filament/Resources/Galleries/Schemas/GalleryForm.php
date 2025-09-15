<?php

namespace App\Filament\Resources\Galleries\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
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
                                    ->placeholder('Enter a concise gallery title'),
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
                        FileUpload::make('attachments')
                            ->label('Images')
                            ->helperText('Upload up to 12 images (JPEG, PNG, WebP, max 2MB each). Drag to reorder.')
                            ->disk('public')
                            ->directory('gallery-images')
                            ->visibility('public')
                            ->image()
                            ->imageEditor()
                            ->panelLayout('grid')
                            ->multiple()
                            ->reorderable()
                            ->openable()
                            ->downloadable()
                            ->maxFiles(12)
                            ->maxSize(2048)
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
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
