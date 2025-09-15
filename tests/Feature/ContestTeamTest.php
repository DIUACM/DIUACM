<?php

use App\Models\Contest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a contest with teams and attaches members', function () {
    $users = User::factory()->count(3)->create();

    $contest = Contest::factory()->create();

    $team = Team::factory()->create([
        'contest_id' => $contest->id,
    ]);

    $team->members()->attach($users->pluck('id'));

    expect($contest->teams)->toHaveCount(1)
        ->and($team->members)->toHaveCount(3);

    // Ensure pivot uniqueness enforcement (second attach of same user should fail)
    expect(fn () => $team->members()->attach($users->first()->id))
        ->toThrow(QueryException::class);
});
