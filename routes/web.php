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

// Event routes
Route::prefix('events')->name('events.')->group(function () {
    Route::get('/', [EventController::class, 'index'])->name('index');
    Route::get('/{event}', [EventController::class, 'show'])->name('show');

    Route::middleware('auth')->group(function () {
        Route::post('/{event}/attendance', [EventController::class, 'storeAttendance'])->name('attendance.store');
    });
});

// Contest routes
Route::prefix('contests')->name('contests.')->group(function () {
    Route::get('/', [ContestController::class, 'index'])->name('index');
    Route::get('/{contest}', [ContestController::class, 'show'])->name('show');
});

// Internal contest routes
Route::prefix('internal-contests')->name('internal-contests.')->group(function () {
    Route::get('/', [InternalContestController::class, 'index'])->name('index');
    Route::get('/{internalContest}', [InternalContestController::class, 'show'])->name('show');

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('/{internalContest}/register', [InternalContestController::class, 'registration'])->name('registration');
        Route::post('/{internalContest}/register', [InternalContestController::class, 'storeRegistration'])->name('store-registration');
        Route::post('/{internalContest}/validate-student-id', [InternalContestController::class, 'validateStudentId'])->name('validate-student-id');
        Route::get('/{internalContest}/my-registration', [InternalContestController::class, 'myRegistration'])->name('my-registration');
    });
});

// Programmer routes
Route::prefix('programmers')->name('programmers.')->group(function () {
    Route::get('/', [ProgrammerController::class, 'index'])->name('index');
    Route::get('/{user:username}', [ProgrammerController::class, 'show'])->name('show');
});

// Blog routes
Route::prefix('blog')->name('blog.')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('index');
    Route::get('/{blogPost}', [BlogController::class, 'show'])->name('show');
});

// Gallery routes
Route::prefix('galleries')->name('galleries.')->group(function () {
    Route::get('/', [GalleryController::class, 'index'])->name('index');
    Route::get('/{gallery}', [GalleryController::class, 'show'])->name('show');
});

// Tracker routes
Route::prefix('trackers')->name('trackers.')->group(function () {
    Route::get('/', [\App\Http\Controllers\TrackerController::class, 'index'])->name('index');
    Route::get('/{slug}', [\App\Http\Controllers\TrackerController::class, 'show'])->name('show');
    Route::get('/{slug}/export', [\App\Http\Controllers\TrackerController::class, 'export'])->name('export');
});

// Profile routes
Route::middleware('auth')->prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
    Route::put('/', [ProfileController::class, 'update'])->name('update');
    Route::post('/avatar', [ProfileController::class, 'updateAvatar'])->name('avatar.update');
    Route::get('/change-password', [ProfileController::class, 'editPassword'])->name('editPassword');
    Route::post('/change-password', [ProfileController::class, 'updatePassword'])->name('updatePassword');
});

// Contact routes
Route::prefix('contact')->name('contact')->group(function () {
    Route::get('/', [ContactController::class, 'contact']);
    Route::post('/', [ContactController::class, 'store'])->name('.store');
});

// Payment routes
Route::middleware('auth')->prefix('payments')->name('payment.')->group(function () {
    Route::get('/registrations/{registration}/select-gateway', [PaymentController::class, 'showGatewaySelection'])
        ->name('registration.select-gateway');
    Route::post('/registrations/{registration}', [PaymentController::class, 'initiateRegistrationPayment'])
        ->name('registration.initiate');
});

// Public payment callback routes (no auth required)
Route::match(['get', 'post'], '/payments/callback/{gateway}', [PaymentController::class, 'handleCallback'])
    ->name('payment.callback');

// IPN (Instant Payment Notification) endpoint - server-to-server
Route::post('/payments/ipn/{gateway}', [PaymentController::class, 'handleIPN'])
    ->name('payment.ipn');
