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
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                FileUpload::make('attachments')
                    ->disk('public')
                    ->directory('gallery-images')
                    ->visibility('public')
                    ->imageEditor()
                    ->multiple()

    ->reorderable()

    ->openable()

    ->downloadable()
                    ->image(),
            ]);
    }
}
