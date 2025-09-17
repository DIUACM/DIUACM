<?php

namespace App\Console\Commands;

use App\Services\RankListScoreService;
use Illuminate\Console\Command;

class RecalculateRanklistScore extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:recalculate-ranklist-score 
                            {--force-all : Force recalculate all ranklists (including inactive ones)}
                            {--ranklist= : Recalculate specific ranklist by ID}
                            {--user= : Recalculate specific user by ID (requires --ranklist option)}
                            {--active-only : Recalculate only active ranklists (default behavior)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate scores for users in ranklists with various options';

    /**
     * Execute the console command.
     */
    public function handle(RankListScoreService $scoreService): int
    {
        $this->info('Starting ranklist score recalculation...');

        // Validate input options
        if (! $this->validateOptions()) {
            return self::INVALID;
        }

        $forceAll = $this->option('force-all');
        $rankListId = $this->option('ranklist');
        $userId = $this->option('user');

        try {
            if ($userId && $rankListId) {
                return $this->recalculateForSpecificUser($scoreService, (int) $rankListId, (int) $userId);
            } elseif ($rankListId) {
                return $this->recalculateForSpecificRankList($scoreService, (int) $rankListId);
            } elseif ($forceAll) {
                return $this->recalculateForAllRankLists($scoreService);
            } else {
                return $this->recalculateForActiveRankLists($scoreService);
            }
        } catch (\Exception $e) {
            $this->error('An error occurred: '.$e->getMessage());

            if ($this->getOutput()->isVerbose()) {
                $this->error($e->getTraceAsString());
            }

            return self::FAILURE;
        }
    }

    /**
     * Validate command options
     */
    private function validateOptions(): bool
    {
        $userId = $this->option('user');
        $rankListId = $this->option('ranklist');
        $forceAll = $this->option('force-all');
        $activeOnly = $this->option('active-only');

        // User option requires ranklist option
        if ($userId && ! $rankListId) {
            $this->error('The --user option requires the --ranklist option to be specified.');

            return false;
        }

        // Cannot use force-all with specific ranklist
        if ($forceAll && $rankListId) {
            $this->error('Cannot use --force-all with --ranklist option. Please choose one.');

            return false;
        }

        // Cannot use force-all with active-only (redundant)
        if ($forceAll && $activeOnly) {
            $this->error('Cannot use --force-all with --active-only. --force-all includes all ranklists.');

            return false;
        }

        // Validate numeric values
        if ($userId && ! is_numeric($userId)) {
            $this->error('User ID must be a valid number.');

            return false;
        }

        if ($rankListId && ! is_numeric($rankListId)) {
            $this->error('Ranklist ID must be a valid number.');

            return false;
        }

        return true;
    }

    /**
     * Recalculate for a specific user in a specific ranklist
     */
    private function recalculateForSpecificUser(RankListScoreService $scoreService, int $rankListId, int $userId): int
    {
        $this->info("Recalculating score for user ID: {$userId} in ranklist ID: {$rankListId}");

        $rankList = $scoreService->getRankListById($rankListId);
        if (! $rankList) {
            $this->error("Ranklist with ID {$rankListId} not found.");

            return self::FAILURE;
        }

        $user = $scoreService->getUserById($userId);
        if (! $user) {
            $this->error("User with ID {$userId} not found.");

            return self::FAILURE;
        }

        $result = $scoreService->recalculateScoreForUser($rankList, $user);

        if ($result['success']) {
            $this->info($result['message']);

            return self::SUCCESS;
        } else {
            $this->error($result['message']);

            return self::FAILURE;
        }
    }

    /**
     * Recalculate for a specific ranklist
     */
    private function recalculateForSpecificRankList(RankListScoreService $scoreService, int $rankListId): int
    {
        $this->info("Recalculating scores for ranklist ID: {$rankListId}");

        $rankList = $scoreService->getRankListById($rankListId);
        if (! $rankList) {
            $this->error("Ranklist with ID {$rankListId} not found.");

            return self::FAILURE;
        }

        $this->info("Processing ranklist: {$rankList->keyword}");

        $result = $scoreService->recalculateScoresForRankList($rankList);

        if ($result['success']) {
            $this->info($result['message']);
            $this->info("Processed {$result['processed_users']} users.");

            return self::SUCCESS;
        } else {
            $this->warn($result['message']);

            return self::SUCCESS; // Not a failure, just no events found
        }
    }

    /**
     * Recalculate for all ranklists (active and inactive)
     */
    private function recalculateForAllRankLists(RankListScoreService $scoreService): int
    {
        $this->info('Recalculating scores for ALL ranklists (including inactive ones)...');

        $rankLists = $scoreService->recalculateAllRankLists();

        if ($rankLists->isEmpty()) {
            $this->warn('No ranklists found.');

            return self::SUCCESS;
        }

        return $this->processRankLists($scoreService, $rankLists, 'all');
    }

    /**
     * Recalculate for active ranklists only
     */
    private function recalculateForActiveRankLists(RankListScoreService $scoreService): int
    {
        $this->info('Recalculating scores for active ranklists...');

        $rankLists = $scoreService->recalculateAllActiveRankLists();

        if ($rankLists->isEmpty()) {
            $this->warn('No active ranklists found.');

            return self::SUCCESS;
        }

        return $this->processRankLists($scoreService, $rankLists, 'active');
    }

    /**
     * Process a collection of ranklists
     */
    private function processRankLists(RankListScoreService $scoreService, $rankLists, string $type): int
    {
        $this->info("Found {$rankLists->count()} {$type} ranklist(s).");

        $bar = $this->output->createProgressBar($rankLists->count());
        $bar->start();

        $totalProcessedUsers = 0;
        $successfulRankLists = 0;
        $failedRankLists = 0;

        foreach ($rankLists as $rankList) {
            $result = $scoreService->recalculateScoresForRankList($rankList);

            if ($result['success']) {
                $successfulRankLists++;
                $totalProcessedUsers += $result['processed_users'];
            } else {
                $failedRankLists++;
                if ($this->getOutput()->isVerbose()) {
                    $this->newLine();
                    $this->warn("Ranklist '{$rankList->keyword}': {$result['message']}");
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        // Summary
        $this->info('Recalculation completed!');
        $this->info("Successfully processed: {$successfulRankLists} ranklist(s)");
        $this->info("Total users processed: {$totalProcessedUsers}");

        if ($failedRankLists > 0) {
            $this->warn("Ranklists with no events: {$failedRankLists}");
        }

        return self::SUCCESS;
    }
}
