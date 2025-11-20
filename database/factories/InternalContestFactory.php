<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InternalContest>
 */
class InternalContestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->words(3, true);
        $startTime = fake()->dateTimeBetween('now', '+1 month');
        $deadline = fake()->dateTimeBetween($startTime, '+2 months');

        return [
            'title' => ucfirst($title),
            'slug' => \Illuminate\Support\Str::slug($title),
            'semester' => fake()->randomElement(['Spring 2024', 'Fall 2024', 'Summer 2024', 'Spring 2025', 'Fall 2025']),
            'description' => '<p>'.fake()->paragraphs(3, true).'</p>',
            'registration_start_time' => $startTime,
            'registration_deadline' => $deadline,
            'registration_limit' => fake()->optional(0.7)->numberBetween(20, 100),
            'registration_fee' => fake()->randomFloat(2, 100, 1500),
            'student_id_rules' => fake()->optional()->randomElement(['regex:/^[0-9-]+$/', 'regex:/^\d{3}-\d{2}-\d{4}$/']),
            'student_id_rules_guide' => fake()->optional()->sentence(),
            'pickup_points' => fake()->optional()->randomElements([
                ['name' => 'Main Gate'],
                ['name' => 'Library'],
                ['name' => 'Cafeteria'],
            ], fake()->numberBetween(1, 3)),
            'departments' => fake()->optional()->randomElements([
                ['name' => 'CSE'],
                ['name' => 'EEE'],
                ['name' => 'BBA'],
            ], fake()->numberBetween(1, 3)),
            'sections' => fake()->optional()->randomElements([
                ['name' => 'A'],
                ['name' => 'B'],
                ['name' => 'C'],
            ], fake()->numberBetween(1, 3)),
            'lab_teacher_names' => fake()->optional()->randomElements([
                ['initial' => 'ABC', 'full_name' => 'Dr. John Doe'],
                ['initial' => 'XYZ', 'full_name' => 'Dr. Jane Smith'],
            ], fake()->numberBetween(1, 2)),
            'status' => fake()->randomElement(['draft', 'published']),
        ];
    }
}
