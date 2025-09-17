<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
        $isPublished = fake()->boolean(70); // 70% chance of being published

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'user_id' => User::factory(),
            'content' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'paragraph',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => fake()->paragraphs(rand(3, 8), true),
                            ],
                        ],
                    ],
                ],
            ],
            'status' => $isPublished ? VisibilityStatus::PUBLISHED : VisibilityStatus::DRAFT,
            'published_at' => $isPublished ? fake()->dateTimeBetween('-1 year', 'now') : null,
            'is_featured' => fake()->boolean(20), // 20% chance of being featured
        ];
    }

    /**
     * Indicate that the blog post should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
            'published_at' => fake()->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Indicate that the blog post should be a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::DRAFT,
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the blog post should be featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
