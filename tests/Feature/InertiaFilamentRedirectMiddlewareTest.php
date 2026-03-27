<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Support\Facades\Route;
use Inertia\Support\Header;

function inertiaHeaders(): array
{
    return [
        Header::INERTIA => 'true',
        Header::VERSION => app(HandleInertiaRequests::class)->version(request()) ?? '',
    ];
}

it('converts inertia redirects to filament panels into browser redirects', function () {
    Route::middleware('web')->get('/__test-filament-redirect', function () {
        return redirect('/admin');
    });

    $this->withHeaders(inertiaHeaders())
        ->get('/__test-filament-redirect')
        ->assertStatus(409)
        ->assertHeader(Header::LOCATION, url('/admin'))
        ->assertHeader('Vary', Header::INERTIA);
});

it('keeps standard inertia redirects unchanged for non filament routes', function () {
    Route::middleware('web')->get('/__test-standard-redirect', function () {
        return redirect('/__test-standard-target');
    });

    Route::middleware('web')->get('/__test-standard-target', function () {
        return 'ok';
    });

    $this->withHeaders(inertiaHeaders())
        ->get('/__test-standard-redirect')
        ->assertRedirect('/__test-standard-target');
});

it('keeps normal browser redirects unchanged for filament routes', function () {
    Route::middleware('web')->get('/__test-browser-filament-redirect', function () {
        return redirect('/contest-admin');
    });

    $this->get('/__test-browser-filament-redirect')
        ->assertRedirect('/contest-admin');
});
