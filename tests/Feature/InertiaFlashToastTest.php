<?php

use Illuminate\Support\Facades\Route;

it('flashes a toast for 419 responses', function () {
    Route::middleware('web')->get('/__test-419', function () {
        abort(419);
    });

    Route::middleware('web')->get('/__test-source', function () {
        return 'ok';
    });

    $this->from('/__test-source')
        ->get('/__test-419')
        ->assertRedirect('/__test-source')
        ->assertSessionHas('inertia.flash_data.toast.type', 'error')
        ->assertSessionHas('inertia.flash_data.toast.message', 'The page expired, please try again.');
});
