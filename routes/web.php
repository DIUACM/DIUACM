<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContestController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\InternalContestController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgrammerController;
use Illuminate\Support\Facades\Route;

Route::get('/', [\App\Http\Controllers\PagesController::class, 'home'])->name('home');
Route::get('/contact', [\App\Http\Controllers\PagesController::class, 'contact'])->name('contact');
Route::get('/about', [\App\Http\Controllers\PagesController::class, 'about'])->name('about');

Route::get('/privacy-policy', [\App\Http\Controllers\PagesController::class, 'privacy'])->name('privacy-policy');
Route::get('/terms-and-conditions', [\App\Http\Controllers\PagesController::class, 'terms'])->name('terms-and-conditions');

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
    Route::get('/register', [AuthController::class, 'register'])->name('register');

    // Google OAuth routes
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

Route::post('/logout', [AuthController::class, 'destroy'])->middleware('auth')->name('logout');

Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
Route::post('/events/{event}/attendance', [EventController::class, 'storeAttendance'])
    ->middleware('auth')
    ->name('events.attendance.store');

Route::get('/contests', [ContestController::class, 'index'])->name('contests.index');
Route::get('/contests/{contest}', [ContestController::class, 'show'])->name('contests.show');

Route::get('/internal-contests', [InternalContestController::class, 'index'])->name('internal-contests.index');
Route::get('/internal-contests/{internalContest:slug}', [InternalContestController::class, 'show'])->name('internal-contests.show');
Route::get('/internal-contests/{internalContest:slug}/register', [InternalContestController::class, 'registration'])->name('internal-contests.registration');
Route::post('/internal-contests/{internalContest:slug}/register', [InternalContestController::class, 'storeRegistration'])->name('internal-contests.store-registration');
Route::post('/internal-contests/{internalContest:slug}/validate-student-id', [InternalContestController::class, 'validateStudentId'])->name('internal-contests.validate-student-id');
Route::get('/internal-contests/{internalContest:slug}/my-registration', [InternalContestController::class, 'myRegistration'])
    ->middleware('auth')
    ->name('internal-contests.my-registration');

Route::get('/programmers', [ProgrammerController::class, 'index'])->name('programmers.index');
Route::get('/programmers/{user:username}', [ProgrammerController::class, 'show'])->name('programmers.show');

Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{blogPost:slug}', [BlogController::class, 'show'])->name('blog.show');

Route::get('/galleries', [GalleryController::class, 'index'])->name('galleries.index');
Route::get('/galleries/{gallery:slug}', [GalleryController::class, 'show'])->name('galleries.show');

Route::get('/trackers', [\App\Http\Controllers\TrackerController::class, 'index'])->name('trackers.index');
Route::get('/trackers/{slug}', [\App\Http\Controllers\TrackerController::class, 'show'])->name('trackers.show');
Route::get('/trackers/{slug}/export', [\App\Http\Controllers\TrackerController::class, 'export'])->name('trackers.export');

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::get('/profile/change-password', [ProfileController::class, 'editPassword'])->name('profile.editPassword');
    Route::post('/profile/change-password', [ProfileController::class, 'updatePassword'])->name('profile.updatePassword');
});

Route::get('/contact', [ContactController::class, 'contact'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Payment routes
Route::middleware('auth')->prefix('payments')->name('payment.')->group(function () {
    Route::post('/registrations/{registration}', [PaymentController::class, 'initiateRegistrationPayment'])
        ->name('registration.initiate');
});

// Public payment callback routes (no auth required)
Route::match(['get', 'post'], '/payments/callback/{gateway}', [PaymentController::class, 'handleCallback'])
    ->name('payment.callback');
