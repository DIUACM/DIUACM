<?php

namespace App\Filament\ContestAdmin\Resources\InternalContests\Resources\InternalContestRegistrations\Schemas;

use App\Enums\Gender;
use App\Enums\PaymentStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class InternalContestRegistrationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('internal_contest_id')
                    ->required()
                    ->numeric(),
                TextInput::make('user_id')
                    ->required()
                    ->numeric(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                TextInput::make('student_id')
                    ->required(),
                TextInput::make('phone')
                    ->tel()
                    ->required(),
                TextInput::make('section')
                    ->required(),
                TextInput::make('department')
                    ->required(),
                TextInput::make('lab_teacher_name')
                    ->required(),
                TextInput::make('tshirt_size')
                    ->required(),
                Select::make('gender')
                    ->options(Gender::class)
                    ->required(),
                Toggle::make('transport_service_required')
                    ->required(),
                TextInput::make('pickup_point'),
                Select::make('payment_status')
                    ->options(PaymentStatus::class)
                    ->default('pending')
                    ->required(),
            ]);
    }
}
