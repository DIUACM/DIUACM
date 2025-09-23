<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class UpdateCodeforcesRatings extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:update-cf-ratings
                            {--delay=300 : Delay between API calls in milliseconds}
                            {--timeout=30 : HTTP timeout in seconds}
                            {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Update Codeforces ratings and clean up handles for all users';

    public function handle(): int
    {
        $this->info('Starting Codeforces usernames cleanup and ratings update');

        // Get all users who have a Codeforces handle
        $users = User::query()
            ->whereNotNull('codeforces_handle')
            ->where('codeforces_handle', '!=', '')
            ->get(['id', 'name', 'codeforces_handle', 'max_cf_rating']);

        $this->info("Found {$users->count()} users with Codeforces handles");

        if ($users->isEmpty()) {
            $this->info('No users with Codeforces handles found');

            return self::SUCCESS;
        }

        $isDryRun = $this->option('dry-run');
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        $updatedCount = 0;
        $cleanedHandles = 0;
        $removedHandles = 0;
        $skippedHandles = 0;
        $errorCount = 0;

        $progressBar = $this->output->createProgressBar($users->count());
        $progressBar->start();

        // Process each user individually
        foreach ($users as $user) {
            $cfHandle = $user->codeforces_handle;

            try {
                // Clean up the handle if it's a URL
                $originalHandle = $cfHandle;
                if (str_starts_with($cfHandle, 'https')) {
                    $urlParts = explode('/', $cfHandle);
                    $cfHandle = urldecode($urlParts[4] ?? '');

                    if (! $isDryRun && $cfHandle !== $originalHandle) {
                        $user->update(['codeforces_handle' => $cfHandle]);
                        $cleanedHandles++;
                        $this->newLine();
                        $this->line("Cleaned up handle for {$user->name}: {$originalHandle} -> {$cfHandle}");
                    } elseif ($isDryRun) {
                        $this->newLine();
                        $this->line("[DRY RUN] Would clean handle for {$user->name}: {$originalHandle} -> {$cfHandle}");
                        $cleanedHandles++;
                    }
                }

                // Fetch user info from Codeforces API
                $response = Http::timeout($this->option('timeout'))
                    ->acceptJson()
                    ->get('https://codeforces.com/api/user.info', [
                        'handles' => $cfHandle,
                    ]);

                if (! $response->successful()) {
                    $this->newLine();
                    if ($user->max_cf_rating < 100) {
                        if (! $isDryRun) {
                            $user->update(['codeforces_handle' => null]);
                            $this->warn("API request failed for {$cfHandle} and rating < 100. Removed handle for {$user->name}.");
                        } else {
                            $this->warn("[DRY RUN] Would remove handle for {$user->name}: {$cfHandle} (rating < 100, API failed)");
                        }
                        $removedHandles++;
                    } else {
                        $this->warn("API request failed for {$cfHandle}. Keeping existing handle (rating >= 100).");
                        $skippedHandles++;
                    }
                    $progressBar->advance();

                    continue;
                }

                $data = $response->json();

                if (($data['status'] ?? null) !== 'OK' || empty($data['result'][0] ?? null)) {
                    $this->newLine();
                    if ($user->max_cf_rating < 100) {
                        if (! $isDryRun) {
                            $user->update(['codeforces_handle' => null]);
                            $this->warn("Invalid handle: {$cfHandle} and rating < 100. Removed handle for {$user->name}.");
                        } else {
                            $this->warn("[DRY RUN] Would remove handle for {$user->name}: {$cfHandle} (rating < 100, invalid handle)");
                        }
                        $removedHandles++;
                    } else {
                        $this->warn("Invalid handle: {$cfHandle}. Keeping existing handle (rating >= 100).");
                        $skippedHandles++;
                    }
                    $progressBar->advance();

                    continue;
                }

                $cfUser = $data['result'][0];
                $maxRating = $cfUser['maxRating'] ?? $cfUser['rating'] ?? 0;
                $properHandle = $cfUser['handle']; // Use the proper case from API

                if (! $isDryRun) {
                    // Update with the proper handle case from API and the max rating
                    $user->update([
                        'codeforces_handle' => $properHandle,
                        'max_cf_rating' => $maxRating,
                    ]);

                    $this->newLine();
                    $this->line("Updated handle and rating for {$properHandle}");
                    $this->line("  Old handle: {$user->codeforces_handle}");
                    $this->line("  New handle: {$properHandle}");
                    $this->line("  Old rating: {$user->max_cf_rating}");
                    $this->line("  New rating: {$maxRating}");
                } else {
                    $this->newLine();
                    $this->line("[DRY RUN] Would update {$user->name}:");
                    $this->line("  Handle: {$user->codeforces_handle} -> {$properHandle}");
                    $this->line("  Rating: {$user->max_cf_rating} -> {$maxRating}");
                }

                $updatedCount++;

                // Add delay to prevent rate limiting
                $delay = (int) $this->option('delay');
                if ($delay > 0) {
                    usleep($delay * 1000); // Convert milliseconds to microseconds
                }

            } catch (\Exception $e) {
                $this->newLine();
                $this->error("Error processing handle: {$cfHandle} - {$e->getMessage()}");
                $errorCount++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Summary
        $this->info('Codeforces usernames cleanup and ratings update completed');
        $this->table(['Metric', 'Count'], [
            ['Processed', $users->count()],
            ['Updated', $updatedCount],
            ['Cleaned Handles', $cleanedHandles],
            ['Removed Handles', $removedHandles],
            ['Skipped Handles', $skippedHandles],
            ['Errors', $errorCount],
        ]);

        return self::SUCCESS;
    }
}
