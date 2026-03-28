<?php

namespace App\Providers;

use Filament\Forms;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $maxNestingDepth = config('livewire.payload.max_nesting_depth');

        if ($maxNestingDepth !== null && $maxNestingDepth < 20) {
            config()->set('livewire.payload.max_nesting_depth', 20);
        }

        Forms\Components\TextInput::configureUsing(function (Forms\Components\TextInput $textInput): void {
            $textInput->dehydrateStateUsing(function (?string $state): ?string {
                return is_string($state) ? trim($state) : $state;
            });
        });
    }
}
