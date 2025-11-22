<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\InternalContest;
use Illuminate\Auth\Access\HandlesAuthorization;

class InternalContestPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:InternalContest');
    }

    public function view(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('View:InternalContest');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:InternalContest');
    }

    public function update(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('Update:InternalContest');
    }

    public function delete(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('Delete:InternalContest');
    }

    public function restore(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('Restore:InternalContest');
    }

    public function forceDelete(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('ForceDelete:InternalContest');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:InternalContest');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:InternalContest');
    }

    public function replicate(AuthUser $authUser, InternalContest $internalContest): bool
    {
        return $authUser->can('Replicate:InternalContest');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:InternalContest');
    }

}