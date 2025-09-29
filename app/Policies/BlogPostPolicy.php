<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BlogPost;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class BlogPostPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:BlogPost');
    }

    public function view(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('View:BlogPost');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:BlogPost');
    }

    public function update(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('Update:BlogPost');
    }

    public function delete(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('Delete:BlogPost');
    }

    public function restore(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('Restore:BlogPost');
    }

    public function forceDelete(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('ForceDelete:BlogPost');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:BlogPost');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:BlogPost');
    }

    public function replicate(AuthUser $authUser, BlogPost $blogPost): bool
    {
        return $authUser->can('Replicate:BlogPost');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:BlogPost');
    }
}
