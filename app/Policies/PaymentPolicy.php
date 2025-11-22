<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\Payment;
use Illuminate\Auth\Access\HandlesAuthorization;

class PaymentPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Payment');
    }

    public function view(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('View:Payment');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Payment');
    }

    public function update(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('Update:Payment');
    }

    public function delete(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('Delete:Payment');
    }

    public function restore(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('Restore:Payment');
    }

    public function forceDelete(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('ForceDelete:Payment');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Payment');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:Payment');
    }

    public function replicate(AuthUser $authUser, Payment $payment): bool
    {
        return $authUser->can('Replicate:Payment');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:Payment');
    }

}