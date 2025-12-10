<?php

use App\Models\IncentiveApplication;
use App\Models\User;

it('shows the incentive application form for authenticated users', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
    ]);

    $this->actingAs($user);

    $response = $this->get(route('incentive-application.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('incentive-application/index')
        ->has('existingApplication')
    );
});

it('requires authentication to access incentive application', function () {
    $response = $this->get(route('incentive-application.index'));

    $response->assertRedirect(route('login'));
});

it('can submit a new incentive application', function () {
    $user = User::factory()->create([
        'email' => 'student@example.com',
    ]);

    $this->actingAs($user);

    $formData = [
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
        'courses' => [
            [
                'teacher_name' => 'Dr. Jane Smith',
                'teacher_initial' => 'JNS',
                'section' => 'A',
                'teacher_email' => 'jane@diu.edu.bd',
                'teacher_phone' => '01712345679',
                'course_name' => 'Introduction to Programming',
                'course_code' => 'CSE101',
            ],
        ],
    ];

    $response = $this->post(route('incentive-application.store'), $formData);

    $response->assertRedirect(route('incentive-application.index'));

    $this->assertDatabaseHas('incentive_applications', [
        'user_id' => $user->id,
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'email' => 'student@example.com',
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
    ]);

    $application = IncentiveApplication::where('user_id', $user->id)->first();
    expect($application->courses)->toBeArray();
    expect($application->courses)->toHaveCount(1);
    expect($application->courses[0]['teacher_name'])->toBe('Dr. Jane Smith');
    expect($application->courses[0]['course_code'])->toBe('CSE101');
});

it('can submit application with multiple courses', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $formData = [
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
        'courses' => [
            [
                'teacher_name' => 'Dr. Jane Smith',
                'teacher_initial' => 'JNS',
                'section' => 'A',
                'teacher_email' => 'jane@diu.edu.bd',
                'teacher_phone' => '01712345679',
                'course_name' => 'Introduction to Programming',
                'course_code' => 'CSE101',
            ],
            [
                'teacher_name' => 'Dr. Bob Johnson',
                'teacher_initial' => 'BJN',
                'section' => 'B',
                'teacher_email' => 'bob@diu.edu.bd',
                'teacher_phone' => '01712345680',
                'course_name' => 'Data Structures',
                'course_code' => 'CSE102',
            ],
        ],
    ];

    $response = $this->post(route('incentive-application.store'), $formData);

    $response->assertRedirect(route('incentive-application.index'));

    $application = IncentiveApplication::where('user_id', $user->id)->first();
    expect($application->courses)->toHaveCount(2);
});

it('updates existing application when user resubmits', function () {
    $user = User::factory()->create([
        'email' => 'student@example.com',
    ]);

    $existingApplication = IncentiveApplication::create([
        'user_id' => $user->id,
        'full_name' => 'Old Name',
        'student_id' => '111-11-1111',
        'batch' => 'CSE 64',
        'email' => 'student@example.com',
        'current_semester' => 'Spring 2025',
        'phone_number' => '01711111111',
        'courses' => [
            [
                'teacher_name' => 'Old Teacher',
                'teacher_initial' => 'OT',
                'section' => 'A',
                'teacher_email' => 'old@diu.edu.bd',
                'teacher_phone' => '01711111112',
                'course_name' => 'Old Course',
                'course_code' => 'CSE100',
            ],
        ],
    ]);

    $this->actingAs($user);

    $updatedData = [
        'full_name' => 'New Name',
        'student_id' => '222-22-2222',
        'batch' => 'CSE 65',
        'current_semester' => 'Fall 2025',
        'phone_number' => '01722222222',
        'courses' => [
            [
                'teacher_name' => 'New Teacher',
                'teacher_initial' => 'NT',
                'section' => 'B',
                'teacher_email' => 'new@diu.edu.bd',
                'teacher_phone' => '01722222223',
                'course_name' => 'New Course',
                'course_code' => 'CSE200',
            ],
        ],
    ];

    $response = $this->post(route('incentive-application.store'), $updatedData);

    $response->assertRedirect(route('incentive-application.index'));

    // Should still only have one application
    expect(IncentiveApplication::where('user_id', $user->id)->count())->toBe(1);

    $this->assertDatabaseHas('incentive_applications', [
        'id' => $existingApplication->id,
        'user_id' => $user->id,
        'full_name' => 'New Name',
        'student_id' => '222-22-2222',
    ]);

    $application = IncentiveApplication::find($existingApplication->id);
    expect($application->courses[0]['course_code'])->toBe('CSE200');
});

it('validates required fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->post(route('incentive-application.store'), []);

    $response->assertSessionHasErrors([
        'full_name',
        'student_id',
        'batch',
        'current_semester',
        'phone_number',
        'courses',
    ]);
});

it('validates course fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $formData = [
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
        'courses' => [
            [
                'teacher_name' => '',
                'teacher_initial' => '',
                'section' => '',
                'teacher_email' => 'invalid-email',
                'teacher_phone' => '',
                'course_name' => '',
                'course_code' => '',
            ],
        ],
    ];

    $response = $this->post(route('incentive-application.store'), $formData);

    $response->assertSessionHasErrors([
        'courses.0.teacher_name',
        'courses.0.teacher_initial',
        'courses.0.section',
        'courses.0.teacher_email',
        'courses.0.teacher_phone',
        'courses.0.course_name',
        'courses.0.course_code',
    ]);
});

it('uses authenticated user email not submitted email', function () {
    $user = User::factory()->create([
        'email' => 'authenticateduser@example.com',
    ]);

    $this->actingAs($user);

    $formData = [
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'email' => 'fake@example.com', // This should be ignored
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
        'courses' => [
            [
                'teacher_name' => 'Dr. Jane Smith',
                'teacher_initial' => 'JNS',
                'section' => 'A',
                'teacher_email' => 'jane@diu.edu.bd',
                'teacher_phone' => '01712345679',
                'course_name' => 'Introduction to Programming',
                'course_code' => 'CSE101',
            ],
        ],
    ];

    $response = $this->post(route('incentive-application.store'), $formData);

    $response->assertRedirect(route('incentive-application.index'));

    // Should use authenticated user's email, not the submitted one
    $this->assertDatabaseHas('incentive_applications', [
        'user_id' => $user->id,
        'email' => 'authenticateduser@example.com',
    ]);

    $this->assertDatabaseMissing('incentive_applications', [
        'email' => 'fake@example.com',
    ]);
});

it('shows existing application when viewing the form', function () {
    $user = User::factory()->create();

    $application = IncentiveApplication::create([
        'user_id' => $user->id,
        'full_name' => 'John Doe',
        'student_id' => '123-45-6789',
        'batch' => 'CSE 65',
        'email' => $user->email,
        'current_semester' => 'Fall 2025',
        'phone_number' => '01712345678',
        'courses' => [
            [
                'teacher_name' => 'Dr. Jane Smith',
                'teacher_initial' => 'JNS',
                'section' => 'A',
                'teacher_email' => 'jane@diu.edu.bd',
                'teacher_phone' => '01712345679',
                'course_name' => 'Introduction to Programming',
                'course_code' => 'CSE101',
            ],
        ],
    ]);

    $this->actingAs($user);

    $response = $this->get(route('incentive-application.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('incentive-application/index')
        ->where('existingApplication.id', $application->id)
        ->where('existingApplication.full_name', 'John Doe')
    );
});
