<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\InternalContestRegistration;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class InternalContestRegistrationPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:InternalContestRegistration');
    }

    public function view(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('View:InternalContestRegistration');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:InternalContestRegistration');
    }

    public function update(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('Update:InternalContestRegistration');
    }

    public function delete(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('Delete:InternalContestRegistration');
    }

    public function restore(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('Restore:InternalContestRegistration');
    }

    public function forceDelete(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('ForceDelete:InternalContestRegistration');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:InternalContestRegistration');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:InternalContestRegistration');
    }

    public function replicate(AuthUser $authUser, InternalContestRegistration $internalContestRegistration): bool
    {
        return $authUser->can('Replicate:InternalContestRegistration');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:InternalContestRegistration');
    }
}
