<?php

use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\ContestController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\TrackerController;
use App\Http\Controllers\Api\VJudgeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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

Route::post('/events/{event}/attend', [EventController::class, 'attend'])
    ->middleware('auth:sanctum');
