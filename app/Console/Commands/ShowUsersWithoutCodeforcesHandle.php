<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ShowUsersWithoutCodeforcesHandle extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:show-users-without-codeforces-handle';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show usernames of users who don\'t have Codeforces handle but have max CF rating > 10';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Finding users without Codeforces handle but with max CF rating > 10...');

        $users = User::whereNull('codeforces_handle')
            ->where('max_cf_rating', '>', 10)
            ->select('username', 'max_cf_rating')
            ->orderBy('max_cf_rating', 'desc')
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users found matching the criteria.');

            return Command::SUCCESS;
        }

        $this->info("Found {$users->count()} users:");
        $this->newLine();

        $tableData = $users->map(function ($user) {
            return [
                'Username' => $user->username,
                'Max CF Rating' => $user->max_cf_rating,
            ];
        })->toArray();

        $this->table(['Username', 'Max CF Rating'], $tableData);

        return Command::SUCCESS;
    }
}
