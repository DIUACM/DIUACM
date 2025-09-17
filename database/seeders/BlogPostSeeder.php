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
        // Ensure we have at least one user to associate posts with
        $user = User::first() ?? User::factory()->create();

        // Create 50 blog posts with a mix of published/draft and featured posts
        BlogPost::factory()
            ->count(35)
            ->published()
            ->for($user, 'author')
            ->create();

        BlogPost::factory()
            ->count(10)
            ->draft()
            ->for($user, 'author')
            ->create();

        BlogPost::factory()
            ->count(5)
            ->published()
            ->featured()
            ->for($user, 'author')
            ->create();
    }
}
