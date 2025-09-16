<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BlogPost>
 */
class BlogPostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(rand(3, 8));

        return [
            'title' => $title,
            'slug' => \Illuminate\Support\Str::slug($title),
            'author' => fake()->name(),
            'content' => fake()->paragraphs(rand(5, 15), true),
            'status' => fake()->randomElement([\App\Enums\VisibilityStatus::PUBLISHED, \App\Enums\VisibilityStatus::DRAFT]),
            'featured_image' => fake()->optional(0.3)->imageUrl(1200, 675, 'technology'),
            'published_at' => fake()->optional(0.8)->dateTimeBetween('-6 months', '+1 month'),
            'is_featured' => fake()->boolean(20), // 20% chance of being featured
        ];
    }

    /**
     * Indicate that the blog post is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => \App\Enums\VisibilityStatus::PUBLISHED,
            'published_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ]);
    }

    /**
     * Indicate that the blog post is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => \App\Enums\VisibilityStatus::DRAFT,
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the blog post is featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
