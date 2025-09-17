<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'sourov2305101004@diu.edu.bd',

        ]);

        $this->call(BlogPostSeeder::class);

        $this->command->info('Creating a temporary dummy image...');
        $imageName = 'dummy-image.png';
        $imagePath = storage_path('app/'.$imageName);
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
        $image = imagecreatetruecolor(1024, 768);
        imagepng($image, $imagePath);
        imagedestroy($image);

        \App\Models\Gallery::factory(20)
            ->create()
            ->each(function ($gallery) use ($imagePath) {
                for ($i = 0; $i < 5; $i++) {
                    $gallery
                        ->addMedia($imagePath)
                        ->preservingOriginal()
                        ->toMediaCollection('gallery_images');
                }
            });

        $this->command->info('Cleaning up temporary image...');
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }
}
