<?php

namespace Database\Seeders;

use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;

class InternalContestRegistrationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🎫 Creating Internal Contest Registrations...');

        // Get the admin user
        $admin = User::where('email', 'sourov2305101004@diu.edu.bd')->first();

        if (! $admin) {
            $this->command->warn('⚠️  Admin user not found. Skipping registration creation.');

            return;
        }

        // Get the contest that is currently open for registration
        $openContest = InternalContest::where('status', 'published')
            ->where('registration_start_time', '<=', now())
            ->where('registration_deadline', '>=', now())
            ->first();

        if (! $openContest) {
            $this->command->warn('⚠️  No open contest found for registration.');

            return;
        }

        // Create registration for admin user
        $registration = InternalContestRegistration::create([
            'internal_contest_id' => $openContest->id,
            'user_id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'student_id' => '201-15-14088',
            'phone' => '01712345678',
            'section' => 'PC',
            'department' => 'CSE',
            'lab_teacher_name' => 'Dr. Rashidul Alam Shakir',
            'tshirt_size' => 'L',
            'gender' => 'male',
            'transport_service_required' => true,
            'pickup_point' => 'DIU Main Gate',
        ]);

        $this->command->info('✅ Internal Contest Registrations created successfully!');
        $this->command->info("   - Admin registered for: {$openContest->title}");
        $this->command->info("   - Registration ID: #{$registration->id}");
        $this->command->info("   - Status: {$registration->getStatus()}");
    }
}
