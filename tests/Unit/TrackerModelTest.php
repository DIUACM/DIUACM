<?php

use App\Enums\VisibilityStatus;
use App\Models\Tracker;

it('uses slug as route key name', function () {
    $tracker = new Tracker;

    expect($tracker->getRouteKeyName())->toBe('slug');
});

it('has correct fillable attributes', function () {
    $tracker = new Tracker;
    $expected = ['title', 'slug', 'description', 'status', 'order'];

    expect($tracker->getFillable())->toBe($expected);
});

it('casts status attribute to VisibilityStatus enum', function () {
    $tracker = new Tracker;
    $casts = $tracker->getCasts();

    expect($casts['status'])->toBe(VisibilityStatus::class);
});

it('has rank lists relationship method', function () {
    $tracker = new Tracker;

    expect(method_exists($tracker, 'rankLists'))->toBeTrue();
    expect(method_exists($tracker, 'scopePublished'))->toBeTrue();
    expect(method_exists($tracker, 'scopeSearch'))->toBeTrue();
});
