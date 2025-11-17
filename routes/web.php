<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::get('/', [\App\Http\Controllers\PagesController::class, 'home'])->name('home');
Route::get('/contact', [\App\Http\Controllers\PagesController::class, 'contact'])->name('contact');
Route::get('/about', [\App\Http\Controllers\PagesController::class, 'about'])->name('about');

Route::get('/privacy-policy', [\App\Http\Controllers\PagesController::class, 'privacy'])->name('privacy-policy');
Route::get('/terms-of-service', [\App\Http\Controllers\PagesController::class, 'terms'])->name('terms-and-conditions');

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
    Route::get('/register', [AuthController::class, 'register'])->name('register');

    // Google OAuth routes
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
Route::post('/events/{event}/attendance', [EventController::class, 'storeAttendance'])
    ->middleware('auth')
    ->name('events.attendance.store');
