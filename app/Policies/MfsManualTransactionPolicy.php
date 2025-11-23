<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\MfsManualTransaction;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class MfsManualTransactionPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:MfsManualTransaction');
    }

    public function view(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('View:MfsManualTransaction');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:MfsManualTransaction');
    }

    public function update(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('Update:MfsManualTransaction');
    }

    public function delete(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('Delete:MfsManualTransaction');
    }

    public function restore(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('Restore:MfsManualTransaction');
    }

    public function forceDelete(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('ForceDelete:MfsManualTransaction');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:MfsManualTransaction');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:MfsManualTransaction');
    }

    public function replicate(AuthUser $authUser, MfsManualTransaction $mfsManualTransaction): bool
    {
        return $authUser->can('Replicate:MfsManualTransaction');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:MfsManualTransaction');
    }
}
