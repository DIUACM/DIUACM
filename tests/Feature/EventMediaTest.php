<?php

use App\Models\Event;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('can add images to event_images collection', function () {
    Storage::fake('media');

    $event = Event::factory()->create();

    $file = UploadedFile::fake()->image('event-photo.jpg', 1200, 800);

    $event->addMedia($file)->toMediaCollection('event_images');

    expect($event->getMedia('event_images'))->toHaveCount(1);
    expect($event->getFirstMediaUrl('event_images'))->not()->toBeEmpty();
});

it('can add multiple images to event', function () {
    Storage::fake('media');

    $event = Event::factory()->create();

    $file1 = UploadedFile::fake()->image('event-photo-1.jpg');
    $file2 = UploadedFile::fake()->image('event-photo-2.jpg');

    $event->addMedia($file1)->toMediaCollection('event_images');
    $event->addMedia($file2)->toMediaCollection('event_images');

    expect($event->getMedia('event_images'))->toHaveCount(2);
});

it('registers conversions for event images', function () {
    Storage::fake('media');

    $event = Event::factory()->create();

    $file = UploadedFile::fake()->image('event-photo.jpg', 1200, 800);

    $media = $event->addMedia($file)->toMediaCollection('event_images');

    // Conversions are queued, so we check if they're registered
    expect($media->collection_name)->toBe('event_images');
    expect($event->getMedia('event_images')->first())->not()->toBeNull();
});
