<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgrammerController;
use App\Http\Controllers\TrackerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/about', function () {
    return Inertia::render('about');
})->name('about');

Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

Route::get('/privacy-policy', function () {
    return Inertia::render('privacy-policy');
})->name('privacy-policy');

Route::get('/terms-and-conditions', function () {
    return Inertia::render('terms-and-conditions');
})->name('terms-and-conditions');

// Events listing
Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');

// Gallery
Route::get('/galleries', [GalleryController::class, 'index'])->name('gallery.index');
Route::get('/galleries/{gallery:slug}', [GalleryController::class, 'show'])->name('gallery.show');

// Programmers
Route::get('/programmers', [ProgrammerController::class, 'index'])->name('programmers.index');
Route::get('/programmers/{user:username}', [ProgrammerController::class, 'show'])->name('programmers.show');

// Trackers
Route::get('/trackers', [TrackerController::class, 'index'])
    ->name('trackers.index');
Route::get('/trackers/{slug}/{keyword?}', [TrackerController::class, 'show'])
    ->where(['slug' => '[A-Za-z0-9\-]([A-Za-z0-9\-])*', 'keyword' => '.*'])
    ->name('trackers.show');

// Event attendance - requires authentication
Route::middleware('auth')->group(function () {
    Route::post('/events/{event}/attend', [EventController::class, 'attend'])->name('events.attend');
});

// Profile routes - require authentication
Route::middleware('auth')->group(function () {
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Password change routes
    Route::get('/profile/change-password', [ProfileController::class, 'showChangePasswordForm'])->name('password.change');
    Route::patch('/profile/change-password', [ProfileController::class, 'changePassword'])->name('password.update');
});

require __DIR__.'/auth.php';
