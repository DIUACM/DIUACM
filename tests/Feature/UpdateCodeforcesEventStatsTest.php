<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('counts virtual contest solves as upsolves', function () {
    Cache::flush();

    $event = Event::factory()->contest()->create([
        'event_link' => 'https://codeforces.com/contest/1234',
    ]);

    $rankList = RankList::factory()->active()->create();

    $event->rankLists()->attach($rankList, ['weight' => 1]);

    $user = User::factory()->withHandles()->create([
        'codeforces_handle' => 'virtual_user',
    ]);

    Http::fake(function (Request $request) {
        expect($request->url())->toContain('contest.standings');
        expect($request->url())->toContain('contestId=1234');

        return Http::response([
            'status' => 'OK',
            'result' => [
                'rows' => [
                    [
                        'party' => [
                            'participantType' => 'VIRTUAL',
                            'members' => [
                                ['handle' => 'virtual_user'],
                            ],
                        ],
                        'problemResults' => [
                            ['points' => 1],
                            ['points' => 0],
                            ['points' => 1],
                        ],
                    ],
                ],
            ],
        ]);
    });

    $this->artisan('app:update-cf-contests', ['--id' => $event->id])
        ->assertSuccessful();

    $stat = EventUserStat::query()
        ->where('event_id', $event->id)
        ->where('user_id', $user->id)
        ->first();

    expect($stat)->not->toBeNull();
    expect($stat->solve_count)->toBe(0);
    expect($stat->upsolve_count)->toBe(2);
    expect($stat->participation)->toBeFalse();
});
