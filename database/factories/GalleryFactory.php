<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Gallery>
 */
class GalleryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->words(3, true);

        return [
            'title' => $title,
            'slug' => str($title)->slug(),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement([VisibilityStatus::DRAFT, VisibilityStatus::PUBLISHED]),
            'attachments' => [
                'gallery-images/sample-image-1.jpg',
                'gallery-images/sample-image-2.jpg',
                'gallery-images/sample-image-3.jpg',
            ],
        ];
    }

    /**
     * Indicate that the gallery is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the gallery is draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::DRAFT,
        ]);
    }

    /**
     * Create a gallery with no images.
     */
    public function withoutImages(): static
    {
        return $this->state(fn (array $attributes) => [
            'attachments' => [],
        ]);
    }

    /**
     * Create a gallery with many images.
     */
    public function withManyImages(): static
    {
        return $this->state(fn (array $attributes) => [
            'attachments' => [
                'gallery-images/image-1.jpg',
                'gallery-images/image-2.jpg',
                'gallery-images/image-3.jpg',
                'gallery-images/image-4.jpg',
                'gallery-images/image-5.jpg',
                'gallery-images/image-6.jpg',
            ],
        ]);
    }
}
