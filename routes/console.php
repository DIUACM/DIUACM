<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:update-codeforces-ratings')->daily();
Schedule::command('app:update-codeforces-event-stats')->everyTwoHours();
Schedule::command('app:update-atcoder-event-stats')->everyTwoHours();
Schedule::command('app:recalculate-ranklist-score')->everyTwoHours();
Schedule::command('app:test-schedule')->everyFiveMinutes();
