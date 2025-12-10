<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class TestScheduleCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-schedule';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test command to verify scheduler is working';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::where('username', 'sourov-alt')->first();

        if (! $user) {
            $this->error('User with username "sourov-alt" not found');

            return self::FAILURE;
        }

        $timestamp = now()->format('Y-m-d H:i:s');
        $user->name = "Schedule Test - {$timestamp}";
        $user->save();

        $this->info("Updated user name to: {$user->name}");

        return self::SUCCESS;
    }
}
