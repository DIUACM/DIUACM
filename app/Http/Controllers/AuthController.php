<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    /**
     * Display the register view.
     */
    public function register(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('home'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors([
                'login' => 'Google authentication failed. Please try again.',
            ]);
        }

        // Check if email domain is allowed
        $email = $googleUser->getEmail();
        $allowedDomains = ['@diu.edu.bd', '@s.diu.edu.bd'];
        $isAllowedDomain = false;

        foreach ($allowedDomains as $domain) {
            if (Str::endsWith($email, $domain)) {
                $isAllowedDomain = true;
                break;
            }
        }

        if (! $isAllowedDomain) {
            return redirect()->route('login')->withErrors([
                'login' => 'Only DIU email addresses (@diu.edu.bd, @s.diu.edu.bd) are allowed to sign in.',
            ]);
        }

        // Check if user exists by email
        $user = User::where('email', $email)->first();

        if (! $user) {
            // Create new user
            $username = $this->generateUniqueUsername($googleUser->getName(), $email);

            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $email,
                'username' => $username,
                'password' => bcrypt(Str::random(24)), // Random password for OAuth users
            ]);

            // Mark email as verified since it's coming from Google OAuth
            $user->markEmailAsVerified();
        } else {
            // For existing users, mark email as verified if not already verified
            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }
        }

        Auth::login($user);

        return redirect()->intended(route('home'));
    }

    /**
     * Generate a unique username based on name and email.
     */
    private function generateUniqueUsername(string $name, string $email): string
    {
        // Start with a clean version of the name
        $baseUsername = Str::slug(Str::before($name, ' '), '');

        // If that doesn't work, try email prefix
        if (empty($baseUsername)) {
            $baseUsername = Str::before($email, '@');
            $baseUsername = Str::slug($baseUsername, '');
        }

        // Ensure it's not empty and has a fallback
        if (empty($baseUsername)) {
            $baseUsername = 'user';
        }

        $username = $baseUsername;
        $counter = 1;

        // Keep trying until we find a unique username
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername.$counter;
            $counter++;
        }

        return $username;
    }
}
