<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InternalContestRegistration>
 */
class InternalContestRegistrationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'internal_contest_id' => \App\Models\InternalContest::factory(),
            'user_id' => \App\Models\User::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'student_id' => fake()->numerify('###-##-####'),
            'phone' => fake()->numerify('01#########'),
            'section' => fake()->randomElement(['A', 'B', 'C', 'D', 'E', 'F']),
            'department' => fake()->randomElement(['CSE', 'EEE', 'BBA', 'English', 'LAW', 'CE', 'Pharmacy']),
            'lab_teacher_name' => fake()->name(),
            'tshirt_size' => fake()->randomElement(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
            'gender' => fake()->randomElement(['male', 'female']),
            'transport_service_required' => fake()->boolean(30),
            'pickup_point' => fake()->boolean(30) ? fake()->randomElement(['Main Campus', 'Dhanmondi', 'Uttara', 'Mirpur']) : null,
        ];
    }
}
