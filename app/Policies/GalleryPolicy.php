<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Gallery;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class GalleryPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Gallery');
    }

    public function view(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('View:Gallery');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Gallery');
    }

    public function update(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Update:Gallery');
    }

    public function delete(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Delete:Gallery');
    }

    public function restore(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Restore:Gallery');
    }

    public function forceDelete(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('ForceDelete:Gallery');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Gallery');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:Gallery');
    }

    public function replicate(AuthUser $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Replicate:Gallery');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:Gallery');
    }
}
