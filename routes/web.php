<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [\App\Http\Controllers\PagesController::class, 'home'])->name('home');
Route::get('/contact', [\App\Http\Controllers\PagesController::class, 'contact'])->name('contact');
Route::get('/about', [\App\Http\Controllers\PagesController::class, 'about'])->name('about');
