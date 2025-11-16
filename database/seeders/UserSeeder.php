<?php

namespace Database\Seeders;

use App\Enums\Gender;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 1000 users...');

        // Create the admin user first
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'sourov2305101004@diu.edu.bd',
            'username' => 'admin_user',
            'gender' => Gender::MALE,
            'department' => 'CSE',
            'student_id' => 'DIU-23051010',
            'max_cf_rating' => 2400,
        ]);

        // Assign super_admin role to the admin user
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['guard_name' => 'web']
        );
        $admin->assignRole($superAdminRole);

        $this->command->info('✅ Admin user created with super_admin role');

        // Create users with competitive programming handles (400 users)
        User::factory()
            ->count(400)
            ->withHandles()
            ->create();

        // Create male users (300 users)
        User::factory()
            ->count(300)
            ->gender(Gender::MALE)
            ->create();

        // Create female users (200 users)
        User::factory()
            ->count(200)
            ->gender(Gender::FEMALE)
            ->create();

        // Create remaining users with mixed attributes (99 users)
        User::factory()
            ->count(99)
            ->create();

        $this->command->info('Created 1000 users successfully!');
    }
}
