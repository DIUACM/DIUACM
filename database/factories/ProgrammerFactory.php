<?php

namespace Database\Factories;

use App\Enums\Gender;
use App\Models\Programmer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Programmer>
 */
class ProgrammerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Programmer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $skills = [
            'PHP', 'JavaScript', 'Python', 'Java', 'C++', 'React', 'Vue.js', 'Laravel',
            'Node.js', 'Django', 'Spring Boot', 'MySQL', 'PostgreSQL', 'MongoDB',
            'Docker', 'AWS', 'Git', 'Linux', 'Algorithms', 'Data Structures'
        ];

        $languages = [
            'PHP', 'JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust',
            'Swift', 'Kotlin', 'Ruby', 'C#', 'Scala', 'Haskell'
        ];

        $departments = [
            'Computer Science', 'Software Engineering', 'Information Technology',
            'Computer Engineering', 'Data Science', 'Cybersecurity', 'Web Development'
        ];

        $locations = [
            'Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Sylhet, Bangladesh',
            'Rajshahi, Bangladesh', 'Khulna, Bangladesh', 'Barisal, Bangladesh',
            'Remote', 'New York, USA', 'London, UK', 'Toronto, Canada'
        ];

        return [
            'user_id' => User::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'username' => fake()->unique()->userName(),
            'image' => fake()->optional(0.7)->imageUrl(400, 400, 'people'),
            'gender' => fake()->randomElement(Gender::cases()),
            'phone' => fake()->optional(0.8)->phoneNumber(),
            'codeforces_handle' => fake()->optional(0.6)->userName(),
            'atcoder_handle' => fake()->optional(0.4)->userName(),
            'vjudge_handle' => fake()->optional(0.3)->userName(),
            'department' => fake()->optional(0.7)->randomElement($departments),
            'student_id' => fake()->optional(0.6)->numerify('########'),
            'max_cf_rating' => fake()->optional(0.5)->numberBetween(1200, 2800),
            'bio' => fake()->optional(0.8)->paragraphs(2, true),
            'skills' => fake()->randomElements($skills, fake()->numberBetween(3, 8)),
            'experience_years' => fake()->numberBetween(0, 10),
            'github_handle' => fake()->optional(0.7)->userName(),
            'linkedin_handle' => fake()->optional(0.5)->userName(),
            'website' => fake()->optional(0.3)->url(),
            'location' => fake()->randomElement($locations),
            'is_available_for_hire' => fake()->boolean(30),
            'hourly_rate' => fake()->optional(0.4)->randomFloat(2, 20, 150),
            'preferred_languages' => fake()->randomElements($languages, fake()->numberBetween(2, 5)),
        ];
    }

    /**
     * Indicate that the programmer is available for hire.
     */
    public function availableForHire(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available_for_hire' => true,
            'hourly_rate' => fake()->randomFloat(2, 30, 150),
        ]);
    }

    /**
     * Indicate that the programmer is a competitive programmer.
     */
    public function competitiveProgrammer(): static
    {
        return $this->state(fn (array $attributes) => [
            'codeforces_handle' => fake()->userName(),
            'atcoder_handle' => fake()->userName(),
            'max_cf_rating' => fake()->numberBetween(1500, 2800),
            'skills' => array_merge(
                fake()->randomElements(['C++', 'Python', 'Java'], 2),
                ['Algorithms', 'Data Structures', 'Competitive Programming']
            ),
        ]);
    }

    /**
     * Indicate that the programmer is a web developer.
     */
    public function webDeveloper(): static
    {
        return $this->state(fn (array $attributes) => [
            'skills' => array_merge(
                fake()->randomElements(['PHP', 'JavaScript', 'Python'], 2),
                fake()->randomElements(['React', 'Vue.js', 'Laravel', 'Node.js'], 2),
                ['HTML', 'CSS', 'Git']
            ),
            'preferred_languages' => fake()->randomElements(['PHP', 'JavaScript', 'TypeScript', 'Python'], 3),
        ]);
    }
}