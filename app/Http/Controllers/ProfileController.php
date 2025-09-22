<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the edit profile form.
     */
    public function edit(): Response
    {
        $user = Auth::user();

        // Get profile picture URL if exists
        $profilePictureUrl = $user->getFirstMediaUrl('profile_picture');

        return Inertia::render('profile/edit', [
            'user' => array_merge($user->toArray(), [
                'profile_picture_url' => $profilePictureUrl ?: null,
            ]),
        ]);
    }

    /**
     * Update the user's profile.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validated();

        // TODO: Handle profile picture upload when image processing is needed
        // For now, skip file upload handling

        // Update user data (excluding profile picture from mass assignment)
        unset($validated['profile_picture']);
        $user->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Show the change password form.
     */
    public function editPassword(): Response
    {
        return Inertia::render('profile/change-password');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(ChangePasswordRequest $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validated();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
