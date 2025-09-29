<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MigrateMediaToLocal extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-media-to-local {--dry-run : Show what would be migrated without actually doing it} {--chunk=100 : Number of media items to process at once}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate media files from S3 (media disk) to local storage (local-media-public disk)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $chunkSize = (int) $this->option('chunk');

        $this->info('Starting media migration from "media" disk to "local-media-public" disk...');

        if ($isDryRun) {
            $this->warn('DRY RUN MODE: No files will be actually migrated.');
        }

        // Get all media items that are on the 'media' disk
        $mediaQuery = Media::where('disk', 'media');
        $totalCount = $mediaQuery->count();

        if ($totalCount === 0) {
            $this->info('No media files found on the "media" disk.');

            return self::SUCCESS;
        }

        $this->info("Found {$totalCount} media files to migrate.");

        $progressBar = $this->output->createProgressBar($totalCount);
        $progressBar->start();

        $migratedCount = 0;
        $errorCount = 0;
        $errors = [];

        // Process media in chunks to avoid memory issues
        $mediaQuery->chunk($chunkSize, function ($mediaItems) use ($isDryRun, $progressBar, &$migratedCount, &$errorCount, &$errors) {
            foreach ($mediaItems as $media) {
                try {
                    if ($this->migrateMediaItem($media, $isDryRun)) {
                        $migratedCount++;
                    }
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "Media ID {$media->id}: ".$e->getMessage();
                }

                $progressBar->advance();
            }
        });

        $progressBar->finish();
        $this->newLine(2);

        // Display results
        if ($isDryRun) {
            $this->info("DRY RUN COMPLETE: {$migratedCount} files would be migrated.");
        } else {
            $this->info("Migration complete: {$migratedCount} files migrated successfully.");
        }

        if ($errorCount > 0) {
            $this->error("{$errorCount} files failed to migrate:");
            foreach ($errors as $error) {
                $this->line("  - {$error}");
            }
        }

        return self::SUCCESS;
    }

    /**
     * Migrate a single media item from 'media' disk to 'local-media-public' disk.
     */
    private function migrateMediaItem(Media $media, bool $isDryRun): bool
    {
        $sourceDisk = Storage::disk('media');
        $targetDisk = Storage::disk('local-media-public');

        // Get the relative file path for storage operations
        $relativePath = $media->id.'/'.$media->file_name;

        if (! $sourceDisk->exists($relativePath)) {
            throw new \Exception("Source file does not exist: {$relativePath}");
        }

        if ($isDryRun) {
            // Just validate that the operation would work
            return true;
        }

        // Create target directory if it doesn't exist
        $targetDir = dirname($relativePath);

        if (! $targetDisk->exists($targetDir)) {
            $targetDisk->makeDirectory($targetDir);
        }

        // Copy the file to the target disk
        $fileContent = $sourceDisk->get($relativePath);
        $targetDisk->put($relativePath, $fileContent);

        // Verify the file was copied successfully
        if (! $targetDisk->exists($relativePath)) {
            throw new \Exception('Failed to copy file to target disk');
        }

        // Update the media record to point to the new disk
        $media->update([
            'disk' => 'local-media-public',
            'conversions_disk' => 'local-media-public',
        ]);

        // Handle conversions if they exist
        $this->migrateConversions($media, $sourceDisk, $targetDisk, $isDryRun);

        return true;
    }

    /**
     * Migrate conversion files for a media item.
     */
    private function migrateConversions(Media $media, $sourceDisk, $targetDisk, bool $isDryRun): void
    {
        $conversions = $media->getGeneratedConversions();

        foreach ($conversions as $conversionName => $conversionExists) {
            if (! $conversionExists) {
                continue;
            }

            try {
                // Build relative path for conversion
                $conversionPath = $media->id.'/conversions/'.$media->file_name.'/'.$conversionName.'.jpg';

                if ($sourceDisk->exists($conversionPath)) {
                    if (! $isDryRun) {
                        $conversionContent = $sourceDisk->get($conversionPath);

                        // Create directory if needed
                        $conversionDir = dirname($conversionPath);
                        if (! $targetDisk->exists($conversionDir)) {
                            $targetDisk->makeDirectory($conversionDir);
                        }

                        $targetDisk->put($conversionPath, $conversionContent);
                    }
                }
            } catch (\Exception $e) {
                // Log conversion migration error but don't fail the main migration
                $this->warn("Failed to migrate conversion '{$conversionName}' for media ID {$media->id}: ".$e->getMessage());
            }
        }
    }
}
