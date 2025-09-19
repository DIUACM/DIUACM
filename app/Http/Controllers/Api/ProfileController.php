<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UploadProfilePictureRequest;
use App\Http\Resources\MeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function show(): MeResource
    {
        return new MeResource(Auth::user());
    }

    public function update(UpdateProfileRequest $request): MeResource
    {
        $user = Auth::user();

        $data = $request->validated();
        unset($data['email']);

        $user->fill($data);
        $user->save();

        return new MeResource($user->refresh());
    }

    public function uploadPicture(UploadProfilePictureRequest $request): JsonResponse
    {
        $user = Auth::user();

        $file = $request->file('profile_picture');

        $user->clearMediaCollection('profile_picture');
        $media = $user->addMedia($file)->toMediaCollection('profile_picture');

        return response()->json([
            'message' => 'Profile picture uploaded successfully.',
            'data' => [
                'url' => $media->getUrl(),
            ],
        ]);
    }
}
