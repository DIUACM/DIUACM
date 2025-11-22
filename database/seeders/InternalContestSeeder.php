<?php

namespace Database\Seeders;

use App\Models\InternalContest;
use Illuminate\Database\Seeder;

class InternalContestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating Paid Events...');

        // Create realistic paid events
        $paidEvents = collect();

        // Event 1: DIU ACM ICPC Winter Programming Camp 2024
        $event1 = InternalContest::create([
            'title' => 'DIU ACM ICPC Winter Programming Camp 2024',
            'slug' => 'diu-acm-icpc-winter-programming-camp-2024',
            'semester' => 'Fall 2024',
            'description' => '<div>
                <h2>About the Camp</h2>
                <p>Join us for an intensive 5-day programming camp designed to sharpen your problem-solving skills and prepare you for the ICPC regional competitions. This camp features hands-on training sessions, mock contests, and expert guidance from experienced competitive programmers.</p>
                
                <h3>What You Will Learn</h3>
                <ul>
                    <li>Advanced algorithms and data structures</li>
                    <li>Dynamic programming techniques</li>
                    <li>Graph theory and shortest path algorithms</li>
                    <li>Competitive programming strategies</li>
                    <li>Time management during contests</li>
                </ul>
                
                <h3>Camp Schedule</h3>
                <p><strong>Duration:</strong> December 15-19, 2024<br>
                <strong>Time:</strong> 9:00 AM - 5:00 PM daily<br>
                <strong>Venue:</strong> DIU Computer Lab (4th Floor, Block B)</p>
                
                <h3>Includes</h3>
                <ul>
                    <li>Training materials and problem sets</li>
                    <li>Certificate of participation</li>
                    <li>Daily lunch and refreshments</li>
                    <li>Camp T-shirt</li>
                    <li>Access to exclusive ICPC resources</li>
                </ul>
                
                <p><strong>Note:</strong> Participants must bring their own laptop for the camp.</p>
            </div>',
            'registration_start_time' => now()->subDays(10),
            'registration_deadline' => now()->addDays(20),
            'registration_limit' => 50,
            'registration_fee' => 1500.00,
            'student_id_rules' => 'regex:/^\d{3}-\d{2}-\d{4}$/',
            'student_id_rules_guide' => 'Student ID must be in format: XXX-XX-XXXX (e.g., 201-15-1234)',
            'pickup_points' => [
                ['name' => 'DIU Main Gate', 'address' => 'Satarkul, Badda, Dhaka', 'contact' => '+880 1234-567890'],
                ['name' => 'DIU Permanent Campus', 'address' => 'Ashulia Model Town, Savar', 'contact' => '+880 1234-567891'],
                ['name' => 'ACM Club Room', 'address' => 'Block B, 5th Floor, DIU', 'contact' => '+880 1234-567892'],
            ],
            'departments' => [
                ['name' => 'CSE', 'code' => 'Computer Science & Engineering'],
                ['name' => 'SWE', 'code' => 'Software Engineering'],
                ['name' => 'CSI', 'code' => 'Computer Science & Informatics'],
                ['name' => 'EEE', 'code' => 'Electrical & Electronic Engineering'],
            ],
            'sections' => [
                ['name' => 'A'],
                ['name' => 'B'],
                ['name' => 'C'],
                ['name' => 'D'],
                ['name' => 'E'],
                ['name' => 'PC'],
            ],
            'lab_teacher_names' => [
                ['initial' => 'RAS', 'full_name' => 'Dr. Rashidul Alam Shakir'],
                ['initial' => 'MSH', 'full_name' => 'Md. Shahriar Hossain'],
                ['initial' => 'FTJ', 'full_name' => 'Fatema Tuz Johora'],
                ['initial' => 'AKM', 'full_name' => 'Abdul Karim Miah'],
            ],
            'tshirt_sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'status' => 'published',
        ]);
        $paidEvents->push($event1);

        // Event 2: DIU Programming Contest Spring 2025
        $event2 = InternalContest::create([
            'title' => 'DIU Programming Contest Spring 2025',
            'slug' => 'diu-programming-contest-spring-2025',
            'semester' => 'Spring 2025',
            'description' => '<div>
                <h2>About the Contest</h2>
                <p>DIU ACM Chapter proudly presents the Spring Programming Contest 2025! This is your opportunity to showcase your coding skills, compete with fellow programmers, and win exciting prizes.</p>
                
                <h3>Contest Details</h3>
                <p><strong>Date:</strong> March 15, 2025<br>
                <strong>Time:</strong> 10:00 AM - 1:00 PM (3 hours)<br>
                <strong>Venue:</strong> DIU Computer Lab Complex<br>
                <strong>Format:</strong> Individual Competition</p>
                
                <h3>Contest Rules</h3>
                <ul>
                    <li>Individual participation only</li>
                    <li>6-8 programming problems of varying difficulty</li>
                    <li>Languages allowed: C, C++, Java, Python</li>
                    <li>No internet access during contest (except judge system)</li>
                    <li>Printed materials allowed</li>
                </ul>
                
                <h3>Prizes</h3>
                <ul>
                    <li><strong>1st Place:</strong> 15,000 BDT + Trophy + Certificate</li>
                    <li><strong>2nd Place:</strong> 10,000 BDT + Trophy + Certificate</li>
                    <li><strong>3rd Place:</strong> 5,000 BDT + Trophy + Certificate</li>
                    <li><strong>Top 10:</strong> Certificates of Excellence</li>
                </ul>
                
                <h3>Registration Includes</h3>
                <ul>
                    <li>Contest participation kit</li>
                    <li>Lunch and refreshments</li>
                    <li>Contest T-shirt</li>
                    <li>Participation certificate</li>
                    <li>Access to problem editorials after contest</li>
                </ul>
                
                <p><strong>Important:</strong> Limited seats available. Register early to secure your spot!</p>
            </div>',
            'registration_start_time' => now()->addDays(5),
            'registration_deadline' => now()->addDays(45),
            'registration_limit' => 80,
            'registration_fee' => 500.00,
            'student_id_rules' => 'regex:/^\d{3}-\d{2}-\d{4}$/',
            'student_id_rules_guide' => 'Student ID must be in format: XXX-XX-XXXX (e.g., 201-15-1234)',
            'pickup_points' => [
                ['name' => 'Main Campus Gate', 'address' => 'Satarkul, Badda, Dhaka', 'contact' => '+880 1711-123456'],
                ['name' => 'Permanent Campus Reception', 'address' => 'Ashulia, Savar, Dhaka', 'contact' => '+880 1811-123456'],
            ],
            'departments' => [
                ['name' => 'CSE', 'code' => 'Computer Science & Engineering'],
                ['name' => 'SWE', 'code' => 'Software Engineering'],
                ['name' => 'CSI', 'code' => 'Computer Science & Informatics'],
                ['name' => 'EEE', 'code' => 'Electrical & Electronic Engineering'],
                ['name' => 'ETE', 'code' => 'Electronics & Telecommunication Engineering'],
                ['name' => 'CIS', 'code' => 'Computer Information Systems'],
            ],
            'sections' => [
                ['name' => 'A'],
                ['name' => 'B'],
                ['name' => 'C'],
                ['name' => 'D'],
                ['name' => 'E'],
                ['name' => 'F'],
                ['name' => 'PC'],
            ],
            'lab_teacher_names' => [
                ['initial' => 'RAS', 'full_name' => 'Dr. Rashidul Alam Shakir'],
                ['initial' => 'MSH', 'full_name' => 'Md. Shahriar Hossain'],
                ['initial' => 'FTJ', 'full_name' => 'Fatema Tuz Johora'],
                ['initial' => 'AKM', 'full_name' => 'Abdul Karim Miah'],
                ['initial' => 'TNR', 'full_name' => 'Tanvir Nayem Rahman'],
                ['initial' => 'SJA', 'full_name' => 'Sadia Jahan Ahmed'],
            ],
            'tshirt_sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            'status' => 'published',
        ]);
        $paidEvents->push($event2);

        $this->command->info('✅ Paid Events seeded successfully!');
        $this->command->info("   - {$paidEvents->count()} Paid Events created");
        $this->command->info("   - '{$event1->title}'");
        $this->command->info("   - '{$event2->title}'");
    }
}
