<?php

namespace App\Filament\Resources\BlogPosts\Schemas;

use App\Enums\VisibilityStatus;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ToggleButtons;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class BlogPostForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Post Content')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->live(onBlur: true)
                            ->afterStateUpdated(fn (string $operation, ?string $state, callable $set) => $operation === 'create' ? $set('slug', Str::slug($state)) : null
                            ),

                        TextInput::make('slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->rules(['alpha_dash'])
                            ->helperText('URL-friendly version of the title'),

                        TextInput::make('author')
                            ->required()
                            ->default(fn () => Auth::user()?->name ?? 'Admin'),

                        RichEditor::make('content')
                            ->required()
                            ->columnSpanFull()
                            ->toolbarButtons([
                                'bold',
                                'italic',
                                'link',
                                'bulletList',
                                'orderedList',
                                'h2',
                                'h3',
                                'blockquote',
                                'codeBlock',
                            ])
                            ->placeholder('Write your blog post content here...'),
                    ]),

                Section::make('Publishing Settings')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->schema([
                                ToggleButtons::make('status')
                                    ->options(VisibilityStatus::class)
                                    ->default(VisibilityStatus::DRAFT)
                                    ->inline()
                                    ->required(),

                                DateTimePicker::make('published_at')
                                    ->label('Publish Date')
                                    ->seconds(false)
                                    ->displayFormat('M j, Y g:i A')
                                    ->timezone('Asia/Dhaka')
                                    ->helperText('Leave blank to publish immediately when status is set to Published'),
                            ]),

                        Grid::make()
                            ->schema([
                                Checkbox::make('is_featured')
                                    ->label('Featured Post')
                                    ->helperText('Featured posts will be highlighted on the blog homepage'),
                            ]),
                    ]),

                Section::make('Media')
                    ->columnSpanFull()
                    ->schema([
                        FileUpload::make('featured_image')
                            ->label('Featured Image')
                            ->image()
                            ->imageEditor()
                            ->imageEditorAspectRatios([
                                '16:9',
                                '4:3',
                                '1:1',
                            ])
                            ->directory('blog/featured-images')
                            ->visibility('public')
                            ->helperText('Recommended size: 1200x675px (16:9 aspect ratio)'),
                    ]),

                Section::make('Post History')
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
                    ])->collapsed()
                    ->hiddenOn('create'),
            ]);
    }
}
