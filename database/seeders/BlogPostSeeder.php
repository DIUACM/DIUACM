<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogPostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 100 blog posts...');

        // Get random users to be authors
        $users = User::inRandomOrder()->limit(20)->get();

        if ($users->isEmpty()) {
            $this->command->warn('No users found, creating some users first...');
            $users = User::factory(5)->create();
        }

        // Create 70 published blog posts
        BlogPost::factory()
            ->count(70)
            ->published()
            ->create()
            ->each(function ($post) use ($users) {
                $post->update(['user_id' => $users->random()->id]);
            });

        // Create 20 draft blog posts
        BlogPost::factory()
            ->count(20)
            ->draft()
            ->create()
            ->each(function ($post) use ($users) {
                $post->update(['user_id' => $users->random()->id]);
            });

        // Create 10 featured published blog posts
        BlogPost::factory()
            ->count(10)
            ->published()
            ->featured()
            ->create()
            ->each(function ($post) use ($users) {
                $post->update(['user_id' => $users->random()->id]);
            });

        $this->command->info('Created 100 blog posts successfully!');
    }
}
