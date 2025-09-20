<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
        $galleryTitles = [
            'ICPC Regional Contest 2024',
            'DIU Programming Marathon',
            'ACM Training Session',
            'Codeforces Contest Highlights',
            'Team Building Workshop',
            'Algorithm Study Group',
            'Contest Prize Distribution',
            'Programming Workshop Series',
            'Hackathon Event Coverage',
            'Tech Talk Series',
            'Student Project Showcase',
            'Orientation Program 2024',
            'Industry Expert Session',
            'Campus Programming Event',
            'Contest Preparation Workshop',
            'Alumni Meetup',
            'Coding Bootcamp',
            'Technical Seminar',
            'Problem Solving Session',
            'Awards Ceremony',
        ];

        $descriptions = [
            'A comprehensive collection of moments captured during our latest programming contest.',
            'Highlights from the annual DIU programming marathon showcasing student talent.',
            'Training session photos featuring students preparing for upcoming contests.',
            'Behind-the-scenes moments from our recent competitive programming event.',
            'Students collaborating and solving complex algorithmic problems together.',
            'Workshop sessions focusing on advanced programming concepts and techniques.',
            'Celebration moments from our latest contest achievement and awards.',
            'Interactive programming sessions with industry experts and mentors.',
            'Documentation of our hackathon event featuring innovative student projects.',
            'Educational workshop series covering various programming topics and skills.',
        ];

        $title = fake()->randomElement($galleryTitles);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->randomNumber(5).'-'.time(),
            'description' => fake()->randomElement($descriptions),
            'status' => fake()->randomElement(VisibilityStatus::cases()),
        ];
    }

    /**
     * Indicate that the gallery should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the gallery should be a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::DRAFT,
        ]);
    }

    /**
     * Create a contest-related gallery.
     */
    public function contestRelated(): static
    {
        $contestTitles = [
            'ICPC Regional Contest 2024',
            'DIU Programming Contest',
            'ACM Contest Highlights',
            'Codeforces Live Contest',
            'IUPC Event Coverage',
        ];

        return $this->state(fn (array $attributes) => [
            'title' => fake()->randomElement($contestTitles),
            'description' => 'Photo gallery showcasing moments from our recent programming contest event.',
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }
}
