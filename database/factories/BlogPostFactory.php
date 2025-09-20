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
        $programmingTopics = [
            'Dynamic Programming: A Comprehensive Guide',
            'Graph Algorithms: BFS and DFS Explained',
            'Understanding Data Structures: Trees and Heaps',
            'Competitive Programming Tips for Beginners',
            'How to Solve String Manipulation Problems',
            'Advanced Algorithms: Segment Trees',
            'Binary Search: From Basic to Advanced',
            'Greedy Algorithms in Problem Solving',
            'Number Theory in Competitive Programming',
            'Contest Strategies: Time Management Tips',
            'Debugging Techniques for Contest Problems',
            'Mathematical Insights in Programming',
            'ACM ICPC Experience and Preparation',
            'Codeforces Rating Improvement Guide',
            'Team Contest Coordination Strategies',
            'Problem Setting: Behind the Scenes',
            'Algorithm Optimization Techniques',
            'Contest Analysis: Recent Problems Review',
            'Programming Interview Preparation',
            'Open Source Contribution Guide for Students',
        ];

        $title = fake()->randomElement($programmingTopics);
        $isPublished = fake()->boolean(75); // 75% chance of being published

        // Generate realistic programming-related content
        $paragraphs = [
            'Programming contests have become an integral part of computer science education, offering students a platform to showcase their problem-solving skills and algorithmic thinking.',
            'In competitive programming, efficiency matters as much as correctness. Understanding time and space complexity is crucial for solving problems within the given constraints.',
            'Many successful programmers attribute their growth to consistent practice and participation in contests. The key is to start with simpler problems and gradually increase difficulty.',
            'Data structures like arrays, trees, and graphs form the foundation of most algorithmic solutions. Mastering these concepts is essential for any aspiring competitive programmer.',
            'The DIU ACM chapter has been instrumental in fostering a culture of competitive programming among students, organizing regular contests and training sessions.',
            'Problem-solving strategies often involve breaking down complex problems into smaller, manageable subproblems. This divide-and-conquer approach is fundamental in algorithm design.',
            'Mathematical concepts such as number theory, combinatorics, and graph theory frequently appear in programming contests, making a strong mathematical foundation valuable.',
            'Team contests like ICPC require not only individual skills but also effective communication and coordination among team members to solve problems efficiently.',
            'The journey from a beginner to an expert programmer is filled with challenges, but each solved problem contributes to building intuition and pattern recognition skills.',
            'Modern competitive programming platforms like Codeforces, AtCoder, and TopCoder provide excellent opportunities for practice and skill assessment.',
        ];

        $selectedParagraphs = fake()->randomElements($paragraphs, rand(3, 6));
        $contentText = implode("\n\n", $selectedParagraphs);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->randomNumber(5).'-'.time(),
            'user_id' => User::factory(),
            'content' => $contentText,
            'status' => $isPublished ? VisibilityStatus::PUBLISHED : VisibilityStatus::DRAFT,
            'published_at' => $isPublished ? fake()->dateTimeBetween('-1 year', 'now') : null,
            'is_featured' => fake()->boolean(15), // 15% chance of being featured
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
