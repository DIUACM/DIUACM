<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Get the authenticated user's session information.
     */
    public function session(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Calculate session expiration based on last activity + session lifetime
        $sessionLifetime = config('session.lifetime'); // in minutes
        $expiresAt = Carbon::now()->addMinutes($sessionLifetime);

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'image' => $user->image,
            ],
            'expires' => $expiresAt->toISOString(),
        ]);
    }
}
