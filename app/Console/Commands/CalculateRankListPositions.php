<?php

namespace App\Console\Commands;

use App\Models\RankList;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CalculateRankListPositions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ranklist:calculate-positions {--rank-list-id=* : Specific rank list IDs to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate and update positions for all users in ranklists based on their scores';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $rankListIds = $this->option('rank-list-id');

        $query = RankList::query();

        if (! empty($rankListIds)) {
            $query->whereIn('id', $rankListIds);
        }

        $rankLists = $query->get();

        if ($rankLists->isEmpty()) {
            $this->error('No ranklists found to process.');

            return self::FAILURE;
        }

        $this->info("Processing {$rankLists->count()} ranklist(s)...");

        $bar = $this->output->createProgressBar($rankLists->count());
        $bar->start();

        foreach ($rankLists as $rankList) {
            $this->calculatePositionsForRankList($rankList);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Positions calculated successfully!');

        return self::SUCCESS;
    }

    /**
     * Calculate positions for a specific ranklist
     */
    protected function calculatePositionsForRankList(RankList $rankList): void
    {
        // Get all users ordered by score descending
        $users = DB::table('rank_list_user')
            ->where('rank_list_id', $rankList->id)
            ->orderBy('score', 'desc')
            ->orderBy('user_id', 'asc')
            ->get(['user_id', 'score']);

        if ($users->isEmpty()) {
            return;
        }

        $position = 1;
        $previousScore = null;
        $sameScoreCount = 0;

        foreach ($users as $index => $user) {
            // If score is different from previous, update position
            if ($previousScore !== null && $user->score < $previousScore) {
                $position = $index + 1;
                $sameScoreCount = 0;
            } elseif ($previousScore === $user->score) {
                $sameScoreCount++;
            }

            DB::table('rank_list_user')
                ->where('rank_list_id', $rankList->id)
                ->where('user_id', $user->user_id)
                ->update(['position' => $position]);

            $previousScore = $user->score;
        }
    }
}
