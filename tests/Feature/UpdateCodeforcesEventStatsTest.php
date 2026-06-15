<?php

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('processes full standings rows and counts post-contest submissions as upsolves', function () {
    Cache::flush();

    $event = Event::factory()->contest()->create([
        'event_link' => 'https://codeforces.com/contest/1234',
    ]);

    $rankList = RankList::factory()->active()->create();

    $event->rankLists()->attach($rankList, ['weight' => 1]);

    $contestUser = User::factory()->withHandles()->create([
        'codeforces_handle' => 'contest_user',
    ]);

    $virtualUser = User::factory()->withHandles()->create([
        'codeforces_handle' => 'virtual_user',
    ]);

    $statusRequests = [];

    Http::fake(function (Request $request) use (&$statusRequests) {
        $url = $request->url();

        if (str_contains($url, 'contest.standings')) {
            parse_str(parse_url($url, PHP_URL_QUERY) ?: '', $query);

            expect($query)->toBe([
                'contestId' => '1234',
            ]);

            return Http::response([
                'status' => 'OK',
                'result' => [
                    'contest' => [
                        'startTimeSeconds' => 1000,
                        'durationSeconds' => 7200,
                    ],
                    'problems' => [
                        ['index' => 'A'],
                        ['index' => 'B'],
                        ['index' => 'C'],
                    ],
                    'rows' => [
                        [
                            'party' => [
                                'participantType' => 'CONTESTANT',
                                'members' => [
                                    ['handle' => 'contest_user'],
                                ],
                            ],
                            'problemResults' => [
                                ['points' => 1],
                                ['points' => 0],
                                ['points' => 0],
                            ],
                        ],
                        [
                            'party' => [
                                'participantType' => 'CONTESTANT',
                                'members' => [
                                    ['handle' => 'someone_else'],
                                ],
                            ],
                            'problemResults' => [
                                ['points' => 1],
                                ['points' => 1],
                                ['points' => 1],
                            ],
                        ],
                    ],
                ],
            ]);
        }

        expect($url)->toContain('user.status');

        parse_str(parse_url($url, PHP_URL_QUERY) ?: '', $query);

        expect($query['contestId'] ?? null)->toBeNull();
        expect($query['from'])->toBe('1');
        expect($query['count'])->toBe('100');

        $statusRequests[] = $query['handle'];

        return Http::response([
            'status' => 'OK',
            'result' => match ($query['handle']) {
                'contest_user' => [
                    codeforcesAcceptedSubmission('A', 8600),
                    codeforcesAcceptedSubmission('B', 8500),
                    codeforcesAcceptedSubmission('B', 8400),
                    codeforcesAcceptedSubmission('C', 8300, 'WRONG_ANSWER'),
                    codeforcesAcceptedSubmission('C', 7000),
                    codeforcesAcceptedSubmission('A', 9000, 'OK', 4321),
                ],
                'virtual_user' => [
                    codeforcesAcceptedSubmission('A', 8600),
                    codeforcesAcceptedSubmission('C', 8500),
                    codeforcesAcceptedSubmission('B', 7000),
                ],
                default => [],
            },
        ]);
    });

    $this->artisan('app:update-cf-contests', ['--id' => $event->id, '--delay' => 0])
        ->assertSuccessful();

    $contestStat = EventUserStat::query()
        ->where('event_id', $event->id)
        ->where('user_id', $contestUser->id)
        ->first();

    $virtualStat = EventUserStat::query()
        ->where('event_id', $event->id)
        ->where('user_id', $virtualUser->id)
        ->first();

    expect($statusRequests)->toBe(['contest_user', 'virtual_user']);
    expect($contestStat)->not->toBeNull();
    expect($contestStat->solve_count)->toBe(1);
    expect($contestStat->upsolve_count)->toBe(1);
    expect($contestStat->participation)->toBeTrue();

    expect($virtualStat)->not->toBeNull();
    expect($virtualStat->solve_count)->toBe(0);
    expect($virtualStat->upsolve_count)->toBe(2);
    expect($virtualStat->participation)->toBeFalse();
});

function codeforcesAcceptedSubmission(string $index, int $creationTimeSeconds, string $verdict = 'OK', int $contestId = 1234): array
{
    return [
        'creationTimeSeconds' => $creationTimeSeconds,
        'verdict' => $verdict,
        'contestId' => $contestId,
        'problem' => [
            'contestId' => $contestId,
            'index' => $index,
        ],
    ];
}
