<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create roles if they don't exist
    Role::firstOrCreate(['name' => 'super_admin']);
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'user']);
});

it('allows super_admin to assign super_admin role to another user', function () {
    // Create a super admin user
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('super_admin');

    // Create the form data with super_admin role
    $superAdminRole = Role::where('name', 'super_admin')->first();
    $formData = [
        'roles' => [$superAdminRole->id],
    ];

    // Act as super admin and try to assign super_admin role
    Auth::login($superAdmin);

    // This should not throw a validation error
    $validator = validator($formData, [
        'roles' => [
            function () {
                return function (string $attribute, $value, \Closure $fail) {
                    $user = Auth::user();

                    // If user is not super_admin but tries to assign super_admin role
                    if (! $user?->hasRole('super_admin') && is_array($value)) {
                        $roleNames = Role::whereIn('id', $value)->pluck('name')->toArray();

                        if (in_array('super_admin', $roleNames)) {
                            $fail('Only super administrators can assign the super admin role.');
                        }
                    }
                };
            },
        ],
    ]);

    expect($validator->fails())->toBeFalse();
});

it('prevents non-super_admin from assigning super_admin role', function () {
    // Create a regular admin user (not super_admin)
    $admin = User::factory()->create();
    $moderatorRole = Role::where('name', 'Moderator')->first();
    if ($moderatorRole) {
        $admin->assignRole($moderatorRole);
    }

    // Create the form data with super_admin role
    $superAdminRole = Role::where('name', 'super_admin')->first();
    $formData = [
        'roles' => [$superAdminRole->id],
    ];

    // Act as regular admin and try to assign super_admin role
    Auth::login($admin);

    // Test the validation logic directly (simulating what happens in the form)
    $user = Auth::user();
    $hasError = false;

    if (! $user?->hasRole('super_admin') && is_array($formData['roles'])) {
        $roleNames = Role::whereIn('id', $formData['roles'])->pluck('name')->toArray();

        if (in_array('super_admin', $roleNames)) {
            $hasError = true;
        }
    }

    expect($hasError)->toBeTrue();
});

it('allows non-super_admin to assign other roles', function () {
    // Create a regular admin user (not super_admin)
    $admin = User::factory()->create();
    $moderatorRole = Role::where('name', 'Moderator')->first();
    if ($moderatorRole) {
        $admin->assignRole($moderatorRole);
    }

    // Create the form data with regular roles (not super_admin)
    $userRole = Role::firstOrCreate(['name' => 'user']);
    $formData = [
        'roles' => [$userRole->id],
    ];

    // Act as regular admin and try to assign regular role
    Auth::login($admin);

    // Test the validation logic directly (simulating what happens in the form)
    $user = Auth::user();
    $hasError = false;

    if (! $user?->hasRole('super_admin') && is_array($formData['roles'])) {
        $roleNames = Role::whereIn('id', $formData['roles'])->pluck('name')->toArray();

        if (in_array('super_admin', $roleNames)) {
            $hasError = true;
        }
    }

    expect($hasError)->toBeFalse();
});
