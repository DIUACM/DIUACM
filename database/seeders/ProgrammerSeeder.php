<?php

namespace Database\Seeders;

use App\Models\Programmer;
use Illuminate\Database\Seeder;

class ProgrammerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some competitive programmers
        Programmer::factory()
            ->count(15)
            ->competitiveProgrammer()
            ->create();

        // Create some web developers
        Programmer::factory()
            ->count(20)
            ->webDeveloper()
            ->create();

        // Create some available for hire
        Programmer::factory()
            ->count(10)
            ->availableForHire()
            ->create();

        // Create some general programmers
        Programmer::factory()
            ->count(25)
            ->create();
    }
}