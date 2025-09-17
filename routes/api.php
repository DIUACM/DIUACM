<?php

use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\ContestController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\GalleryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
