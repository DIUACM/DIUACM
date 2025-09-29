<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Contest;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class ContestPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Contest');
    }

    public function view(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('View:Contest');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Contest');
    }

    public function update(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('Update:Contest');
    }

    public function delete(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('Delete:Contest');
    }

    public function restore(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('Restore:Contest');
    }

    public function forceDelete(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('ForceDelete:Contest');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Contest');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:Contest');
    }

    public function replicate(AuthUser $authUser, Contest $contest): bool
    {
        return $authUser->can('Replicate:Contest');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:Contest');
    }
}
