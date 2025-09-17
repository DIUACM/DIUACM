<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting database seeding...');

        // Seed in proper order due to relationships
        $this->command->info('📊 Seeding Users (1000 users)...');
        $this->call(UserSeeder::class);

        $this->command->info('🖼️ Seeding Galleries (100 galleries)...');
        $this->call(GallerySeeder::class);

        $this->command->info('🏆 Seeding Contests (100 contests)...');
        $this->call(ContestSeeder::class);

        $this->command->info('👥 Seeding Teams (2-10 teams per contest)...');
        $this->call(TeamSeeder::class);

        $this->command->info('📝 Seeding Blog Posts (100 posts)...');
        $this->call(BlogPostSeeder::class);

        $this->command->info('📅 Seeding Events (50 events)...');
        $this->call(EventSeeder::class);

        $this->command->info('📊 Seeding Trackers (10 trackers)...');
        $this->call(TrackerSeeder::class);

        $this->command->info('📈 Seeding Rank Lists (2-4 per tracker)...');
        $this->call(RankListSeeder::class);

        $this->command->info('📋 Seeding Event User Stats...');
        $this->call(EventUserStatSeeder::class);

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->info('📈 Summary:');
        $this->command->info('   - 1000 Users created');
        $this->command->info('   - 100 Blog Posts created');
        $this->command->info('   - 100 Galleries created');
        $this->command->info('   - 100 Contests created');
        $this->command->info('   - Variable Teams created (2-10 per contest)');
        $this->command->info('   - 50 Events created with attendees');
        $this->command->info('   - 10 Trackers created');
        $this->command->info('   - Variable Rank Lists created (2-4 per tracker)');
        $this->command->info('   - Event User Stats created for all events');
        $this->command->info('');
        $this->command->info('🎉 Your DIU ACM application is now ready with realistic demo data!');
    }
}
