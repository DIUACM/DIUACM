<?php

use App\Models\BlogPost;
use App\Models\Contest;
use App\Models\EventUserStat;
use App\Models\IncentiveApplication;
use App\Models\InternalContestRegistration;
use App\Models\JobExperience;
use App\Models\Payment;
use App\Models\RankList;
use App\Models\Team;

it('casts reference ids to integers', function (string $modelClass, array $attributes) {
    $model = new $modelClass($attributes);

    foreach (array_keys($attributes) as $attribute) {
        expect($model->getAttribute($attribute))->toBeInt();
    }
})->with([
    [BlogPost::class, ['user_id' => '12']],
    [Contest::class, ['gallery_id' => '7']],
    [EventUserStat::class, ['event_id' => '3', 'user_id' => '9']],
    [IncentiveApplication::class, ['user_id' => '15']],
    [InternalContestRegistration::class, ['internal_contest_id' => '4', 'user_id' => '18']],
    [JobExperience::class, ['user_id' => '21']],
    [Payment::class, ['payable_id' => '24']],
    [RankList::class, ['tracker_id' => '6']],
    [Team::class, ['contest_id' => '11']],
]);
