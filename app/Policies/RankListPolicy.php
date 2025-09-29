<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\RankList;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class RankListPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:RankList');
    }

    public function view(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('View:RankList');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:RankList');
    }

    public function update(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('Update:RankList');
    }

    public function delete(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('Delete:RankList');
    }

    public function restore(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('Restore:RankList');
    }

    public function forceDelete(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('ForceDelete:RankList');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:RankList');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:RankList');
    }

    public function replicate(AuthUser $authUser, RankList $rankList): bool
    {
        return $authUser->can('Replicate:RankList');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:RankList');
    }
}
