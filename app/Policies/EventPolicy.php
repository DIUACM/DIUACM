<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Event;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class EventPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Event');
    }

    public function view(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('View:Event');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Event');
    }

    public function update(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('Update:Event');
    }

    public function delete(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('Delete:Event');
    }

    public function restore(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('Restore:Event');
    }

    public function forceDelete(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('ForceDelete:Event');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Event');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:Event');
    }

    public function replicate(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('Replicate:Event');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:Event');
    }

    public function manageAttendance(AuthUser $authUser, Event $event): bool
    {
        return $authUser->can('ManageAttendance:Event');
    }
}
