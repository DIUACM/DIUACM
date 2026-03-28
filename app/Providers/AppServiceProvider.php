<?php

namespace App\Providers;

use Filament\Forms;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    private const MINIMUM_LIVEWIRE_NESTING_DEPTH = 20;

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

        if ($maxNestingDepth !== null && $maxNestingDepth < self::MINIMUM_LIVEWIRE_NESTING_DEPTH) {
            config()->set('livewire.payload.max_nesting_depth', self::MINIMUM_LIVEWIRE_NESTING_DEPTH);
        }

        Forms\Components\TextInput::configureUsing(function (Forms\Components\TextInput $textInput): void {
            $textInput->dehydrateStateUsing(function (?string $state): ?string {
                return is_string($state) ? trim($state) : $state;
            });
        });
    }
}
