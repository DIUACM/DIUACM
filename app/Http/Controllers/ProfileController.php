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
use RalphJSmit\Laravel\SEO\Support\SEOData;

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
        ])->withViewData([
            'SEOData' => new SEOData(
                title: 'Edit Profile',
                description: 'Update your DIU ACM profile information, including personal details and competitive programming handles.',
            ),
        ]);
    }

    /**
     * Update the user's profile.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validated();

        // Remove profile picture from the validated data since it's handled separately
        unset($validated['profile_picture']);

        // Update user data
        $user->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the user's profile picture only.
     */
    public function updateProfilePicture(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'profile_picture' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        $profilePicture = $request->file('profile_picture');
        if ($profilePicture) {
            // Clear existing profile picture
            $user->clearMediaCollection('profile_picture');

            // Get the file extension
            $extension = $profilePicture->getClientOriginalExtension();

            // Create custom filename: username-profile.ext
            $filename = $user->username.'-profile.'.$extension;

            // Add new profile picture with custom filename
            $user->addMedia($profilePicture)
                ->usingFileName($filename)
                ->toMediaCollection('profile_picture');

            $profilePictureUrl = $user->getFirstMediaUrl('profile_picture');

            return response()->json([
                'success' => true,
                'message' => 'Profile picture updated successfully.',
                'profile_picture_url' => $profilePictureUrl,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No profile picture provided.',
        ], 400);
    }

    /**
     * Show the change password form.
     */
    public function editPassword(): Response
    {
        return Inertia::render('profile/change-password')->withViewData([
            'SEOData' => new SEOData(
                title: 'Change Password',
                description: 'Update your DIU ACM account password to keep your account secure.',
            ),
        ]);
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
