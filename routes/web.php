<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\VJudgeController;

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

// Profile routes - require authentication
Route::middleware('auth')->group(function () {
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Password change routes
    Route::get('/profile/change-password', [ProfileController::class, 'showChangePasswordForm'])->name('password.change');
    Route::patch('/profile/change-password', [ProfileController::class, 'changePassword'])->name('password.update');
});

Route::get('/api/auth/session', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/api/events/vjudge', [VJudgeController::class, 'getActiveContests']);
Route::post('/api/events/{eventId}/vjudge', [VJudgeController::class, 'processContestData'])
    ->where('eventId', '[0-9]+');

require __DIR__.'/auth.php';
