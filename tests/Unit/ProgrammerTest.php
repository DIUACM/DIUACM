<?php

use App\Models\Programmer;
use App\Models\User;
use App\Models\Event;
use App\Models\RankList;

it('can create a programmer', function () {
    $programmer = Programmer::factory()->create();

    expect($programmer)->toBeInstanceOf(Programmer::class);
    expect($programmer->name)->toBeString();
    expect($programmer->email)->toBeString();
    expect($programmer->username)->toBeString();
});

it('can create a programmer with user relationship', function () {
    $user = User::factory()->create();
    $programmer = Programmer::factory()->create(['user_id' => $user->id]);

    expect($programmer->user)->toBeInstanceOf(User::class);
    expect($programmer->user->id)->toBe($user->id);
});

it('casts skills to array', function () {
    $skills = ['PHP', 'Laravel', 'JavaScript'];
    $programmer = Programmer::factory()->create(['skills' => $skills]);

    expect($programmer->skills)->toBeArray();
    expect($programmer->skills)->toBe($skills);
});

it('casts preferred_languages to array', function () {
    $languages = ['PHP', 'JavaScript', 'Python'];
    $programmer = Programmer::factory()->create(['preferred_languages' => $languages]);

    expect($programmer->preferred_languages)->toBeArray();
    expect($programmer->preferred_languages)->toBe($languages);
});

it('casts max_cf_rating to integer', function () {
    $programmer = Programmer::factory()->create(['max_cf_rating' => '2500']);

    expect($programmer->max_cf_rating)->toBeInt();
    expect($programmer->max_cf_rating)->toBe(2500);
});

it('casts experience_years to integer', function () {
    $programmer = Programmer::factory()->create(['experience_years' => '5']);

    expect($programmer->experience_years)->toBeInt();
    expect($programmer->experience_years)->toBe(5);
});

it('casts is_available_for_hire to boolean', function () {
    $programmer = Programmer::factory()->create(['is_available_for_hire' => '1']);

    expect($programmer->is_available_for_hire)->toBeBool();
    expect($programmer->is_available_for_hire)->toBeTrue();
});

it('casts hourly_rate to decimal', function () {
    $programmer = Programmer::factory()->create(['hourly_rate' => '75.50']);

    expect($programmer->hourly_rate)->toBeFloat();
    expect($programmer->hourly_rate)->toBe(75.50);
});

it('can create competitive programmer using factory state', function () {
    $programmer = Programmer::factory()->competitiveProgrammer()->create();

    expect($programmer->codeforces_handle)->not->toBeNull();
    expect($programmer->atcoder_handle)->not->toBeNull();
    expect($programmer->max_cf_rating)->toBeGreaterThanOrEqual(1500);
    expect($programmer->skills)->toContain('Algorithms');
    expect($programmer->skills)->toContain('Data Structures');
    expect($programmer->skills)->toContain('Competitive Programming');
});

it('can create web developer using factory state', function () {
    $programmer = Programmer::factory()->webDeveloper()->create();

    expect($programmer->skills)->toContain('HTML');
    expect($programmer->skills)->toContain('CSS');
    expect($programmer->skills)->toContain('Git');
    expect($programmer->preferred_languages)->toHaveCount(3);
});

it('can create available for hire programmer using factory state', function () {
    $programmer = Programmer::factory()->availableForHire()->create();

    expect($programmer->is_available_for_hire)->toBeTrue();
    expect($programmer->hourly_rate)->toBeGreaterThan(0);
});

it('has fillable attributes', function () {
    $programmer = new Programmer();

    $fillable = [
        'name', 'email', 'username', 'image', 'gender', 'phone',
        'codeforces_handle', 'atcoder_handle', 'vjudge_handle',
        'department', 'student_id', 'max_cf_rating', 'bio', 'skills',
        'experience_years', 'github_handle', 'linkedin_handle',
        'website', 'location', 'is_available_for_hire', 'hourly_rate',
        'preferred_languages'
    ];

    expect($programmer->getFillable())->toBe($fillable);
});

it('can have attended events relationship', function () {
    $programmer = Programmer::factory()->create();
    $event = Event::factory()->create();

    $programmer->attendedEvents()->attach($event);

    expect($programmer->attendedEvents)->toHaveCount(1);
    expect($programmer->attendedEvents->first())->toBeInstanceOf(Event::class);
});

it('can have rank lists relationship', function () {
    $programmer = Programmer::factory()->create();
    $rankList = RankList::factory()->create();

    $programmer->rankLists()->attach($rankList, ['score' => 100]);

    expect($programmer->rankLists)->toHaveCount(1);
    expect($programmer->rankLists->first())->toBeInstanceOf(RankList::class);
    expect($programmer->rankLists->first()->pivot->score)->toBe(100);
});