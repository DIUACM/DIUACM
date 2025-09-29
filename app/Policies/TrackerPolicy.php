<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Tracker;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class TrackerPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Tracker');
    }

    public function view(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('View:Tracker');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Tracker');
    }

    public function update(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('Update:Tracker');
    }

    public function delete(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('Delete:Tracker');
    }

    public function restore(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('Restore:Tracker');
    }

    public function forceDelete(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('ForceDelete:Tracker');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Tracker');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:Tracker');
    }

    public function replicate(AuthUser $authUser, Tracker $tracker): bool
    {
        return $authUser->can('Replicate:Tracker');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:Tracker');
    }
}
