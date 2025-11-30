<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ClearOpcache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'opcache:clear';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear the OPcache by calling the clearing script';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Clearing OPcache...');

        $response = Http::get('https://sourov.me/opcache.php');

        if ($response->successful()) {
            $this->info('OPcache cleared request sent successfully.');
            $this->info($response->body());
        } else {
            $this->error('Failed to clear OPcache.');
            $this->error('Status: '.$response->status());
        }
    }
}
