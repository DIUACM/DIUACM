<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ContestController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgrammerController;
use App\Http\Controllers\Api\TrackerController;
use App\Http\Controllers\Api\VJudgeController;
use Illuminate\Support\Facades\Route;

Route::get('/events/vjudge', [VJudgeController::class, 'getActiveContests'])
    ->middleware('auth:sanctum');
Route::post('/events/{eventId}/vjudge-update', [VJudgeController::class, 'processContestData'])
    ->middleware('auth:sanctum')
    ->where('eventId', '[0-9]+');

Route::apiResource('galleries', GalleryController::class)->only([
    'index', 'show',
]);

Route::apiResource('blog-posts', BlogPostController::class)->only([
    'index', 'show',
]);

Route::apiResource('contests', ContestController::class)->only([
    'index', 'show',
]);

Route::apiResource('events', EventController::class)->only([
    'index', 'show',
]);

Route::apiResource('trackers', TrackerController::class)->only([
    'index', 'show',
]);

Route::apiResource('programmers', ProgrammerController::class)->only([
    'index', 'show',
]);

Route::post('/events/{event}/attend', [EventController::class, 'attend'])
    ->middleware('auth:sanctum');

Route::post('/contact', [ContactController::class, 'store']);

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])
    ->middleware('auth:sanctum');

// Profile update & picture upload
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/picture', [ProfileController::class, 'uploadPicture']);
});
