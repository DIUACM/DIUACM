<?php

namespace Database\Seeders;

use App\Models\Contest;
use App\Models\Gallery;
use Illuminate\Database\Seeder;

class ContestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 100 contests...');

        // Get existing galleries to associate with contests
        $galleries = Gallery::all();

        if ($galleries->isEmpty()) {
            $this->command->warn('No galleries found, creating some galleries first...');
            $galleries = Gallery::factory(20)->published()->create();
        }

        // Create 30 ICPC Regional contests
        Contest::factory()
            ->count(30)
            ->icpcRegional()
            ->withStandings()
            ->create()
            ->each(function ($contest) use ($galleries) {
                $contest->update(['gallery_id' => $galleries->random()->id]);
            });

        // Create 25 IUPC contests
        Contest::factory()
            ->count(25)
            ->iupc()
            ->create()
            ->each(function ($contest) use ($galleries) {
                $contest->update(['gallery_id' => $galleries->random()->id]);
            });

        // Create 20 recent contests
        Contest::factory()
            ->count(20)
            ->recent()
            ->withStandings()
            ->create()
            ->each(function ($contest) use ($galleries) {
                $contest->update(['gallery_id' => $galleries->random()->id]);
            });

        // Create 25 other contests
        Contest::factory()
            ->count(25)
            ->create()
            ->each(function ($contest) use ($galleries) {
                $contest->update(['gallery_id' => $galleries->random()->id]);
            });

        $this->command->info('Created 100 contests successfully!');
    }
}
