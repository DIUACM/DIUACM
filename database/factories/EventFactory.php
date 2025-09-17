<?php

namespace Database\Factories;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $eventTitles = [
            'Weekly Training Session',
            'Advanced Algorithms Workshop',
            'ICPC Mock Contest',
            'Dynamic Programming Class',
            'Graph Theory Workshop',
            'Problem Solving Marathon',
            'Codeforces Contest',
            'AtCoder Beginner Contest',
            'Data Structures Deep Dive',
            'String Algorithms Session',
            'Number Theory Workshop',
            'Geometry Problems Class',
            'Greedy Algorithms Training',
            'Binary Search Mastery',
            'Tree Algorithms Workshop',
            'Contest Preparation Session',
            'Algorithm Analysis Class',
            'Competitive Programming Bootcamp',
            'Problem Setting Workshop',
            'Contest Strategy Session',
            'Team Contest Practice',
            'Individual Contest',
            'Debugging Techniques Class',
            'Time Complexity Analysis',
            'Mathematics for Programming',
        ];

        $descriptions = [
            'A comprehensive training session designed to enhance problem-solving skills and algorithmic thinking.',
            'Interactive workshop focusing on advanced programming concepts and competitive programming strategies.',
            'Practice contest session to prepare students for upcoming programming competitions.',
            'Educational class covering fundamental and advanced topics in computer science and algorithms.',
            'Hands-on workshop where students solve real programming problems and learn new techniques.',
            'Intensive training program designed to improve coding skills and contest performance.',
            'Live contest session with real-time problem solving and ranking updates.',
            'Beginner-friendly contest focusing on foundational programming concepts and basic algorithms.',
            'Deep exploration of data structures with practical implementation and problem-solving applications.',
            'Specialized session covering advanced algorithmic topics and their practical applications.',
        ];

        $startingAt = fake()->dateTimeBetween('-1 month', '+3 months');
        $duration = fake()->randomElement([60, 90, 120, 150, 180, 240, 300]); // Duration in minutes
        $endingAt = \Carbon\Carbon::parse($startingAt)->addMinutes($duration);

        $eventType = fake()->randomElement(EventType::cases());
        $hasEventLink = fake()->boolean(80); // 80% chance of having an event link
        $hasPassword = $hasEventLink && fake()->boolean(40); // 40% chance of having password if there's a link
        $openForAttendance = fake()->boolean(70); // 70% chance of being open for attendance

        return [
            'title' => fake()->randomElement($eventTitles),
            'description' => fake()->randomElement($descriptions),
            'status' => fake()->randomElement(VisibilityStatus::cases()),
            'starting_at' => $startingAt,
            'ending_at' => $endingAt,
            'event_link' => $hasEventLink ? fake()->url() : null,
            'event_password' => $hasPassword ? fake()->password(8, 16) : null,
            'open_for_attendance' => $openForAttendance,
            'strict_attendance' => $openForAttendance ? fake()->boolean(30) : false, // 30% chance if attendance is open
            'auto_update_score' => fake()->boolean(60), // 60% chance of auto score update
            'type' => $eventType,
            'participation_scope' => fake()->randomElement(ParticipationScope::cases()),
        ];
    }

    /**
     * Indicate that the event should be a contest.
     */
    public function contest(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::CONTEST,
            'title' => fake()->randomElement([
                'ICPC Mock Contest',
                'Codeforces Round',
                'AtCoder Contest',
                'Programming Marathon',
                'Algorithm Contest',
                'Team Contest',
            ]),
            'auto_update_score' => true,
            'open_for_attendance' => true,
        ]);
    }

    /**
     * Indicate that the event should be a class.
     */
    public function class(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::_CLASS,
            'title' => fake()->randomElement([
                'Dynamic Programming Class',
                'Graph Theory Workshop',
                'Data Structures Session',
                'Algorithm Analysis Class',
                'Mathematics for Programming',
            ]),
            'auto_update_score' => false,
        ]);
    }

    /**
     * Indicate that the event should be published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisibilityStatus::PUBLISHED,
        ]);
    }

    /**
     * Indicate that the event should be upcoming.
     */
    public function upcoming(): static
    {
        return $this->state(fn (array $attributes) => [
            'starting_at' => fake()->dateTimeBetween('now', '+1 month'),
            'ending_at' => fake()->dateTimeBetween('+1 hour', '+1 month +3 hours'),
        ]);
    }

    /**
     * Indicate that the event should be past.
     */
    public function past(): static
    {
        $startingAt = fake()->dateTimeBetween('-6 months', '-1 day');
        $duration = fake()->randomElement([60, 90, 120, 150, 180, 240, 300]);
        $endingAt = \Carbon\Carbon::parse($startingAt)->addMinutes($duration);

        return $this->state(fn (array $attributes) => [
            'starting_at' => $startingAt,
            'ending_at' => $endingAt,
        ]);
    }

    /**
     * Indicate that the event should be open for all.
     */
    public function openForAll(): static
    {
        return $this->state(fn (array $attributes) => [
            'participation_scope' => ParticipationScope::OPEN_FOR_ALL,
        ]);
    }
}
