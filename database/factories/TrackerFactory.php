<?php

namespace Database\Factories;

use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tracker>
 */
class TrackerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $trackerTitles = [
            'ICPC Training Tracker',
            'Weekly Contest Tracker',
            'Algorithm Mastery Tracker',
            'Competitive Programming Progress',
            'Problem Solving Performance',
            'Contest Participation Tracker',
            'Skill Development Tracker',
            'Academic Performance Monitor',
            'Programming Bootcamp Tracker',
            'Team Performance Evaluator',
            'Individual Progress Tracker',
            'Contest Achievement System',
            'Training Progress Monitor',
            'Programming Skill Assessor',
            'Competition Readiness Tracker',
            'Student Performance Dashboard',
            'Algorithmic Skills Tracker',
            'Coding Excellence Monitor',
            'Programming Proficiency Tracker',
            'Contest Preparation System',
        ];

        $descriptions = [
            'Comprehensive tracking system designed to monitor student progress in competitive programming activities and academic performance.',
            'Advanced performance evaluation system that tracks contest participation, problem-solving skills, and algorithmic understanding.',
            'Detailed monitoring system for tracking individual and team performance across various programming challenges and contests.',
            'Systematic approach to measuring and tracking programming skill development through contests, training sessions, and academic activities.',
            'Performance tracking system designed to evaluate student growth in competitive programming and problem-solving capabilities.',
            'Integrated tracking platform for monitoring contest participation, skill development, and academic achievement in programming.',
            'Dynamic tracking system that evaluates progress in algorithm mastery, contest performance, and programming proficiency.',
            'Comprehensive evaluation system for tracking student engagement and performance in programming-related activities.',
            'Advanced monitoring platform designed to track programming skills, contest achievements, and academic progress.',
            'Detailed performance tracking system focusing on competitive programming excellence and skill development.',
        ];

        $title = fake()->randomElement($trackerTitles);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->randomNumber(5).'-'.time(),
            'description' => fake()->randomElement($descriptions),
            'status' => fake()->randomElement(VisibilityStatus::cases()),
            'order' => fake()->numberBetween(1, 50),
        ];
    }

    /**
     * Indicate that the tracker should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the tracker should be a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::DRAFT,
        ]);
    }

    /**
     * Set a specific order for the tracker.
     */
    public function order(int $order): static
    {
        return $this->state(fn (array $attributes) => [
            'order' => $order,
        ]);
    }

    /**
     * Create a contest-focused tracker.
     */
    public function contestFocused(): static
    {
        return $this->state(fn (array $attributes) => [
            'title' => fake()->randomElement([
                'ICPC Training Tracker',
                'Contest Performance Monitor',
                'Competitive Programming Tracker',
                'Contest Achievement System',
            ]),
            'description' => 'Specialized tracking system focused on competitive programming contests and ICPC preparation.',
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Create an academic-focused tracker.
     */
    public function academicFocused(): static
    {
        return $this->state(fn (array $attributes) => [
            'title' => fake()->randomElement([
                'Academic Performance Monitor',
                'Programming Course Tracker',
                'Skill Development Tracker',
                'Student Progress Dashboard',
            ]),
            'description' => 'Academic tracking system designed to monitor student progress in programming courses and skill development.',
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }
}
