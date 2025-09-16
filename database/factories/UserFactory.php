<?php

namespace Database\Factories;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->name();
        $email = fake()->unique()->safeEmail();
        $baseUsername = Str::slug(Str::before($email, '@')) ?: Str::slug($name);
        $username = $baseUsername.'_'.fake()->unique()->numerify('####');

        return [
            'name' => $name,
            'email' => $email,
            'username' => $username,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'gender' => fake()->randomElement(Gender::cases()),
            'phone' => fake()->unique()->e164PhoneNumber(),
            'codeforces_handle' => fake()->optional(0.5)->bothify('cf_????_##'),
            'atcoder_handle' => fake()->optional(0.5)->bothify('ac_????_##'),
            'vjudge_handle' => fake()->optional(0.5)->bothify('vj_????_##'),
            'department' => strtoupper(fake()->randomElement(['CSE', 'EEE', 'SWE', 'BBA', 'CE'])),
            'student_id' => fake()->unique()->bothify('DIU-########'),
            'max_cf_rating' => fake()->numberBetween(800, 3500),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate the user should have competitive programming handles.
     */
    public function withHandles(): static
    {
        return $this->state(fn (array $attributes) => [
            'codeforces_handle' => $attributes['codeforces_handle'] ?? fake()->bothify('cf_????_##'),
            'atcoder_handle' => $attributes['atcoder_handle'] ?? fake()->bothify('ac_????_##'),
            'vjudge_handle' => $attributes['vjudge_handle'] ?? fake()->bothify('vj_????_##'),
        ]);
    }

    /**
     * Set a specific gender for the user.
     */
    public function gender(Gender $gender): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => $gender,
        ]);
    }

    /**
     * Set a custom plaintext password for the user.
     */
    public function password(string $plainTextPassword): static
    {
        return $this->state(function (array $attributes) use ($plainTextPassword) {
            static::$password = Hash::make($plainTextPassword);

            return [
                'password' => static::$password,
            ];
        });
    }
}
