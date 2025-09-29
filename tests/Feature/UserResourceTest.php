<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create permissions for testing
    Permission::create(['name' => 'AssignRoles:User', 'guard_name' => 'web']);

    // Create roles for testing
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);
    Role::create(['name' => 'Moderator', 'guard_name' => 'web']);
});

it('can assign roles to users via model relationship', function () {
    $user = User::factory()->create();
    $moderatorRole = Role::where('name', 'Moderator')->first();
    $superAdminRole = Role::where('name', 'super_admin')->first();

    // Test assigning single role
    $user->assignRole('Moderator');
    expect($user->hasRole('Moderator'))->toBeTrue();

    // Test assigning multiple roles
    $user->assignRole('super_admin');
    expect($user->hasRole('super_admin'))->toBeTrue();
    expect($user->hasRole('Moderator'))->toBeTrue();

    // Test syncing roles (this is what Filament does internally)
    $user->syncRoles(['super_admin']);
    expect($user->hasRole('super_admin'))->toBeTrue();
    expect($user->hasRole('Moderator'))->toBeFalse();

    // Test removing all roles
    $user->syncRoles([]);
    expect($user->hasRole('super_admin'))->toBeFalse();
    expect($user->hasRole('Moderator'))->toBeFalse();
});

it('can check user permissions for role assignment', function () {
    $admin = User::factory()->create();
    $regularUser = User::factory()->create();

    // Give admin the permission to assign roles
    $admin->givePermissionTo('AssignRoles:User');

    expect($admin->can('assignRoles', User::class))->toBeTrue();
    expect($regularUser->can('assignRoles', User::class))->toBeFalse();
});

it('user role relationship works correctly', function () {
    $user = User::factory()->create();
    $moderatorRole = Role::where('name', 'Moderator')->first();

    // Test the relationship exists
    expect($user->roles())->toBeInstanceOf(\Illuminate\Database\Eloquent\Relations\MorphToMany::class);

    // Test attaching via relationship
    $user->roles()->attach($moderatorRole->id);
    expect($user->hasRole('Moderator'))->toBeTrue();

    // Test detaching via relationship
    $user->roles()->detach($moderatorRole->id);
    $user->refresh(); // Refresh to clear cached relationships
    expect($user->hasRole('Moderator'))->toBeFalse();

    // Test syncing via relationship (this is what Filament Select uses)
    $user->roles()->sync([$moderatorRole->id]);
    $user->refresh(); // Refresh to ensure the relationship is loaded
    expect($user->hasRole('Moderator'))->toBeTrue();
});
