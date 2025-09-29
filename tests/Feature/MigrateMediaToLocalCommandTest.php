<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Set up test disks
    Storage::fake('media');
    Storage::fake('local-media-public');
});

it('can migrate media from media disk to local-media-public disk', function () {
    // Create a test user (assuming User model uses HasMedia trait)
    $user = User::factory()->create();
    
    // Create a fake file on the media disk
    $file = UploadedFile::fake()->image('test.jpg', 100, 100);
    
    // Store the file using Spatie Media Library on the 'media' disk
    $media = $user->addMediaFromString($file->getContent())
        ->usingFileName('test.jpg')
        ->usingName('Test Image')
        ->toMediaCollection('default', 'media');
    
    // Verify the media record was created with the correct disk
    expect($media->disk)->toBe('media');
    expect($media->conversions_disk)->toBe('media');
    
    // Verify file exists on source disk
    $relativePath = $media->id.'/'.$media->file_name;
    expect(Storage::disk('media')->exists($relativePath))->toBeTrue();
    
    // Run the migration command
    $exitCode = Artisan::call('app:migrate-media-to-local');
    expect($exitCode)->toBe(0);
    
    // Refresh the media model to get updated data
    $media->refresh();
    
    // Verify the media record was updated
    expect($media->disk)->toBe('local-media-public');
    expect($media->conversions_disk)->toBe('local-media-public');
    
    // Verify file exists on target disk
    expect(Storage::disk('local-media-public')->exists($relativePath))->toBeTrue();
});

it('can run in dry-run mode without migrating files', function () {
    // Create a test user
    $user = User::factory()->create();
    
    // Create a fake file on the media disk
    $file = UploadedFile::fake()->image('test.jpg', 100, 100);
    
    $media = $user->addMediaFromString($file->getContent())
        ->usingFileName('test.jpg')
        ->usingName('Test Image')
        ->toMediaCollection('default', 'media');
    
    $relativePath = $media->id.'/'.$media->file_name;
    
    // Run the migration command in dry-run mode
    $exitCode = Artisan::call('app:migrate-media-to-local', ['--dry-run' => true]);
    expect($exitCode)->toBe(0);
    
    // Refresh the media model
    $media->refresh();
    
    // Verify nothing was actually migrated
    expect($media->disk)->toBe('media');
    expect($media->conversions_disk)->toBe('media');
    expect(Storage::disk('local-media-public')->exists($relativePath))->toBeFalse();
});

it('handles empty media collection gracefully', function () {
    // Ensure no media exists on the 'media' disk
    Media::where('disk', 'media')->delete();
    
    // Run the migration command with no media files
    $exitCode = Artisan::call('app:migrate-media-to-local');
    expect($exitCode)->toBe(0);
});

it('can process media in custom chunk sizes', function () {
    // Create multiple media files
    $user = User::factory()->create();
    
    for ($i = 1; $i <= 3; $i++) {
        $file = UploadedFile::fake()->image("test{$i}.jpg", 100, 100);
        $user->addMediaFromString($file->getContent())
            ->usingFileName("test{$i}.jpg")
            ->usingName("Test Image {$i}")
            ->toMediaCollection('default', 'media');
    }
    
    // Run with chunk size of 2
    $exitCode = Artisan::call('app:migrate-media-to-local', ['--chunk' => 2]);
    expect($exitCode)->toBe(0);
    
    // Verify all media were migrated
    $migratedCount = Media::where('disk', 'local-media-public')->count();
    expect($migratedCount)->toBe(3);
});
