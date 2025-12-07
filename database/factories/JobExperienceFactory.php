<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobExperience>
 */
class JobExperienceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCurrent = fake()->boolean(30);
        $startDate = fake()->dateTimeBetween('-5 years', '-6 months');
        $endDate = $isCurrent ? null : fake()->dateTimeBetween($startDate, 'now');

        $companies = [
            'Google',
            'Microsoft',
            'Amazon',
            'Meta',
            'Apple',
            'Netflix',
            'Tesla',
            'IBM',
            'Oracle',
            'Salesforce',
            'Adobe',
            'Uber',
            'Airbnb',
            'Spotify',
            'TechCorp',
            'CodeLabs',
            'DataSystems',
            'CloudVentures',
            'InnovateTech',
            'ByteWorks',
        ];

        $positions = [
            'Software Engineer',
            'Senior Software Engineer',
            'Junior Software Engineer',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'DevOps Engineer',
            'Data Scientist',
            'Machine Learning Engineer',
            'Product Manager',
            'Engineering Manager',
            'Technical Lead',
            'Software Architect',
            'QA Engineer',
            'System Administrator',
        ];

        $locations = [
            'San Francisco, CA',
            'New York, NY',
            'Seattle, WA',
            'Austin, TX',
            'Boston, MA',
            'Remote',
            'Dhaka, Bangladesh',
            'London, UK',
            'Berlin, Germany',
            'Singapore',
            'Toronto, Canada',
            'Sydney, Australia',
        ];

        return [
            'user_id' => User::factory(),
            'company_name' => fake()->randomElement($companies),
            'position' => fake()->randomElement($positions),
            'description' => fake()->optional(0.8)->paragraphs(3, true),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_current' => $isCurrent,
            'location' => fake()->randomElement($locations),
            'company_website' => fake()->optional(0.7)->url(),
        ];
    }

    /**
     * Indicate that this is a current position.
     */
    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_current' => true,
            'end_date' => null,
        ]);
    }

    /**
     * Indicate that this is a past position.
     */
    public function past(): static
    {
        return $this->state(function (array $attributes) {
            $startDate = $attributes['start_date'];

            return [
                'is_current' => false,
                'end_date' => fake()->dateTimeBetween($startDate, 'now'),
            ];
        });
    }
}
