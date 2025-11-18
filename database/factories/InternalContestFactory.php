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
        $title = fake()->sentence(3);
        
        return [
            'title' => $title,
            'slug' => str($title)->slug(),
            'semester' => fake()->randomElement(['Spring 2024', 'Fall 2024', 'Summer 2024']),
            'description' => fake()->paragraph(),
            'registration_deadline' => fake()->dateTimeBetween('+1 week', '+2 weeks'),
            'registration_start_time' => fake()->dateTimeBetween('now', '+1 week'),
            'registration_limit' => fake()->numberBetween(50, 200),
            'registration_fee' => fake()->randomFloat(2, 0, 500),
            'student_id_rules' => fake()->regexify('[0-9]{3}-[0-9]{2}-[0-9]{4}'),
            'student_id_rules_guide' => 'Format: XXX-XX-XXXX',
            'pickup_points' => fake()->randomElements(['Room 101', 'Room 202', 'Main Office', 'Lab 1'], 2),
            'departments' => fake()->randomElements(['CSE', 'EEE', 'BBA', 'English'], 3),
            'sections' => fake()->randomElements(['A', 'B', 'C', 'D', 'E'], 2),
            'lab_teacher_names' => fake()->randomElements(['Dr. Smith', 'Prof. Johnson', 'Dr. Williams'], 2),
            'tshirt_sizes' => fake()->randomElements(['S', 'M', 'L', 'XL', 'XXL'], 4),
            'status' => fake()->randomElement(['draft', 'published', 'closed']),
        ];
    }
}
