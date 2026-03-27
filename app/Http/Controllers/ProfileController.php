<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
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

        // Get avatar URL if exists
        $avatarUrl = $user->avatar_url;

        return Inertia::render('profile/edit', [
            'user' => array_merge($user->toArray(), [
                'avatar' => $avatarUrl,
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

        // Remove avatar from the validated data since it's handled separately
        unset($validated['avatar']);

        // Update user data
        $user->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Profile updated successfully.',
        ]);

        return back();
    }

    /**
     * Update the user's avatar only.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $user = Auth::user();

        $avatar = $request->file('avatar');
        if ($avatar) {
            // Clear existing profile picture
            $user->clearMediaCollection('profile_picture');

            // Get the file extension
            $extension = $avatar->getClientOriginalExtension();

            // Create custom filename: username-profile.ext
            $filename = $user->username.'-profile.'.$extension;

            // Add new avatar with custom filename
            $user->addMedia($avatar)
                ->usingFileName($filename)
                ->toMediaCollection('profile_picture');

            // Clear avatar cache
            cache()->forget("user.{$user->id}.avatar");

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Profile picture updated successfully.',
            ]);

            return back();
        }

        return back()->withErrors(['avatar' => 'No avatar provided.']);
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

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Password updated successfully.',
        ]);

        return back();
    }
}
