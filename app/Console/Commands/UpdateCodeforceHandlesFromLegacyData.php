<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class UpdateCodeforceHandlesFromLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-codeforces-handles-from-legacy-data 
                            {--dry-run : Show what would be updated without making changes}
                            {--file=storage/app/private/users.json : Path to the legacy JSON file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update Codeforces handles from legacy JSON data for users where the handle is null or empty';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $filePath = $this->option('file');

        $this->info('Starting Codeforces handle update from legacy data...');

        if ($isDryRun) {
            $this->warn('DRY RUN MODE: No changes will be made to the database');
        }

        // Check if file exists
        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");

            return self::FAILURE;
        }

        // Read and parse JSON file
        $jsonContent = file_get_contents($filePath);
        $data = json_decode($jsonContent, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Invalid JSON file: '.json_last_error_msg());

            return self::FAILURE;
        }

        // Find the users table data
        $usersData = null;
        foreach ($data as $item) {
            if (isset($item['type']) && $item['type'] === 'table' &&
                isset($item['name']) && $item['name'] === 'users' &&
                isset($item['data'])) {
                $usersData = $item['data'];
                break;
            }
        }

        if (! $usersData) {
            $this->error('Users table data not found in JSON file');

            return self::FAILURE;
        }

        $this->info('Found '.count($usersData).' users in legacy data');

        $updatedCount = 0;
        $skippedCount = 0;
        $notFoundCount = 0;

        $this->output->progressStart(count($usersData));

        foreach ($usersData as $legacyUser) {
            $this->output->progressAdvance();

            $email = $legacyUser['email'] ?? null;
            $legacyCodeforceHandle = $legacyUser['codeforces_username'] ?? null;

            // Skip if no email or no codeforces handle in legacy data
            if (! $email || ! $legacyCodeforceHandle || trim($legacyCodeforceHandle) === '') {
                $skippedCount++;

                continue;
            }

            // Find user by email
            $user = User::where('email', $email)->first();

            if (! $user) {
                $notFoundCount++;

                continue;
            }

            // Check if user's current codeforces handle is null or empty
            if (! empty($user->codeforces_handle) && trim($user->codeforces_handle) !== '') {
                $skippedCount++;

                continue;
            }

            // Update the handle
            if (! $isDryRun) {
                $user->update(['codeforces_handle' => trim($legacyCodeforceHandle)]);
            }

            $this->line("Would update user {$user->name} ({$email}) with handle: {$legacyCodeforceHandle}", 'info');
            $updatedCount++;
        }

        $this->output->progressFinish();

        // Summary
        $this->newLine();
        $this->info('Update Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Updated', $updatedCount],
                ['Skipped (already has handle or no legacy handle)', $skippedCount],
                ['Not found in database', $notFoundCount],
                ['Total processed', count($usersData)],
            ]
        );

        if ($isDryRun) {
            $this->warn('This was a dry run. No changes were made to the database.');
            $this->info('Run the command without --dry-run to apply the changes.');
        } else {
            $this->info("Successfully updated {$updatedCount} user(s) with Codeforces handles.");
        }

        return self::SUCCESS;
    }
}
