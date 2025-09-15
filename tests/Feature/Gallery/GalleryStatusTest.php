<?php

use App\Enums\VisibilityStatus;
use App\Models\Gallery;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('creates a gallery with draft status by default', function () {
    $user = User::factory()->create();
    actingAs($user);

    $gallery = Gallery::create([
        'title' => 'Sample Gallery',
        'description' => 'Test',
        'attachments' => [],
    ]);

    expect($gallery->status)->toBe(VisibilityStatus::DRAFT);
});

it('allows updating gallery status to published', function () {
    $user = User::factory()->create();
    actingAs($user);

    $gallery = Gallery::create([
        'title' => 'Another Gallery',
        'description' => 'Desc',
        'attachments' => [],
    ]);

    $gallery->update(['status' => VisibilityStatus::PUBLISHED]);

    expect($gallery->refresh()->status)->toBe(VisibilityStatus::PUBLISHED);
});
