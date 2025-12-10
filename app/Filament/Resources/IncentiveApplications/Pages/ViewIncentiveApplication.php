<?php

namespace App\Filament\Resources\IncentiveApplications\Pages;

use App\Filament\Resources\IncentiveApplications\IncentiveApplicationResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Pages\ViewRecord;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ViewIncentiveApplication extends ViewRecord
{
    protected static string $resource = IncentiveApplicationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
            DeleteAction::make(),
        ];
    }

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Personal Information')
                    ->columnSpanFull()
                    ->schema([
                        Grid::make()
                            ->columns(3)
                            ->schema([
                                TextEntry::make('full_name')
                                    ->label('Full Name'),
                                TextEntry::make('student_id')
                                    ->label('Student ID'),
                                TextEntry::make('email')
                                    ->label('Email')
                                    ->copyable(),
                            ]),
                        Grid::make()
                            ->columns(3)
                            ->schema([
                                TextEntry::make('batch')
                                    ->label('Batch'),
                                TextEntry::make('current_semester')
                                    ->label('Current Semester'),
                                TextEntry::make('phone_number')
                                    ->label('Phone Number')
                                    ->copyable(),
                            ]),
                        Grid::make()
                            ->columns(2)
                            ->schema([
                                TextEntry::make('user.name')
                                    ->label('Associated User'),
                                TextEntry::make('created_at')
                                    ->label('Submitted At')
                                    ->dateTime('M j, Y g:i A')
                                    ->timezone('Asia/Dhaka'),
                            ]),
                    ]),

                Section::make('Courses')
                    ->columnSpanFull()
                    ->schema([
                        RepeatableEntry::make('courses')
                            ->label('')
                            ->schema([
                                Grid::make()
                                    ->columns(2)
                                    ->schema([
                                        TextEntry::make('course_name')
                                            ->label('Course Name'),
                                        TextEntry::make('course_code')
                                            ->label('Course Code'),
                                    ]),
                                Grid::make()
                                    ->columns(3)
                                    ->schema([
                                        TextEntry::make('teacher_name')
                                            ->label('Teacher Name'),
                                        TextEntry::make('teacher_initial')
                                            ->label('Teacher Initial'),
                                        TextEntry::make('section')
                                            ->label('Section'),
                                    ]),
                                Grid::make()
                                    ->columns(2)
                                    ->schema([
                                        TextEntry::make('teacher_email')
                                            ->label('Teacher Email')
                                            ->copyable(),
                                        TextEntry::make('teacher_phone')
                                            ->label('Teacher Phone')
                                            ->copyable(),
                                    ]),
                            ])
                            ->contained(true),
                    ]),
            ]);
    }
}
