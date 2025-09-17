<?php

namespace Database\Seeders;

use App\Models\Gallery;
use Illuminate\Database\Seeder;

class GallerySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 100 galleries...');

        // Create temporary dummy image
        $this->command->info('Creating a temporary dummy image...');
        $imageName = 'dummy-gallery-image.png';
        $imagePath = storage_path('app/'.$imageName);

        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        $image = imagecreatetruecolor(1024, 768);
        $backgroundColor = imagecolorallocate($image, 45, 55, 72); // Nice dark blue
        imagefill($image, 0, 0, $backgroundColor);

        $textColor = imagecolorallocate($image, 255, 255, 255);
        $text = 'DIU ACM Gallery Image';
        imagestring($image, 5, 350, 380, $text, $textColor);

        imagepng($image, $imagePath);
        imagedestroy($image);

        // Create 80 published galleries
        Gallery::factory()
            ->count(80)
            ->published()
            ->create()
            ->each(function ($gallery) use ($imagePath) {
                // Add 3-8 images to each gallery
                $imageCount = rand(3, 8);
                for ($i = 0; $i < $imageCount; $i++) {
                    $gallery
                        ->addMedia($imagePath)
                        ->preservingOriginal()
                        ->toMediaCollection('gallery_images');
                }
            });

        // Create 15 contest-related galleries
        Gallery::factory()
            ->count(15)
            ->contestRelated()
            ->create()
            ->each(function ($gallery) use ($imagePath) {
                // Contest galleries get more images (5-12)
                $imageCount = rand(5, 12);
                for ($i = 0; $i < $imageCount; $i++) {
                    $gallery
                        ->addMedia($imagePath)
                        ->preservingOriginal()
                        ->toMediaCollection('gallery_images');
                }
            });

        // Create 5 draft galleries
        Gallery::factory()
            ->count(5)
            ->draft()
            ->create()
            ->each(function ($gallery) use ($imagePath) {
                // Draft galleries get fewer images (1-3)
                $imageCount = rand(1, 3);
                for ($i = 0; $i < $imageCount; $i++) {
                    $gallery
                        ->addMedia($imagePath)
                        ->preservingOriginal()
                        ->toMediaCollection('gallery_images');
                }
            });

        // Clean up temporary image
        $this->command->info('Cleaning up temporary image...');
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        $this->command->info('Created 100 galleries successfully!');
    }
}
