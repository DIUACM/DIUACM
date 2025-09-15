<?php

namespace App\Filament\Resources\Galleries\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class GalleryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->label('Title')
                    ->maxLength(120)
                    ->required()
                    ->autocomplete(false)
                    ->placeholder('Enter a concise gallery title'),
                Textarea::make('description')
                    ->label('Description')
                    ->rows(5)
                    ->maxLength(1000)
                    ->placeholder('Optional description of this gallery')
                    ->columnSpanFull(),
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
            ]);
    }
}
