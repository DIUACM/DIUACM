<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Icons\Heroicon;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('verify_email')
                ->label('Verify Email')
                ->icon(Heroicon::OutlinedCheckBadge)
                ->color('success')
                ->hidden(fn () => $this->record->hasVerifiedEmail())
                ->requiresConfirmation()
                ->modalHeading('Verify Email')
                ->modalDescription('Are you sure you want to manually verify this user\'s email address?')
                ->action(function () {
                    $this->record->markEmailAsVerified();

                    Notification::make()
                        ->title('Email verified successfully')
                        ->success()
                        ->send();
                }),
            DeleteAction::make(),
        ];
    }
}
