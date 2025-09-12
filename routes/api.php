<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\VJudgeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::get('/user', [AuthController::class, 'session'])->middleware('auth:sanctum');

Route::get('/events/vjudge', [VJudgeController::class, 'getActiveContests'])
->middleware('auth:sanctum');
Route::post('/events/{eventId}/vjudge-update', [VJudgeController::class, 'processContestData'])
    ->middleware('auth:sanctum')
    ->where('eventId', '[0-9]+');
