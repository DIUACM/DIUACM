<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Mail\ContactFormMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Show the contact form.
     */
    public function index(): Response
    {
        return Inertia::render('contact')->withViewData([
            'title' => 'Contact Us',
        ]);
    }

    /**
     * Handle contact form submission.
     */
    public function store(ContactFormRequest $request): RedirectResponse
    {
        // Rate limiting: 5 attempts per IP per hour
        $key = 'contact_form_'.request()->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return redirect()->back()
                ->withErrors(['form' => 'Too many contact form submissions. Please try again in '.ceil($seconds / 60).' minutes.'])
                ->withInput()
                ->with('preserveScroll', true);
        }

        $validated = $request->validated();

        // Sanitize input data
        $validated['name'] = strip_tags(trim($validated['name']));
        $validated['message'] = strip_tags(trim($validated['message']));

        try {
            // Send email to submissions@diuacm.com
            Mail::to('submissions@diuacm.com')->send(
                new ContactFormMail(
                    senderName: $validated['name'],
                    senderEmail: $validated['email'],
                    messageContent: $validated['message']
                )
            );

            // Clear rate limit on successful submission to not penalize real users
            RateLimiter::clear($key);

            return redirect()->back()->with('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you within 24-48 hours.');

        } catch (\Exception $e) {
            // Only increment rate limit on failure to prevent abuse
            RateLimiter::hit($key, 3600); // 1 hour

            Log::error('Contact form email failed', [
                'error' => $e->getMessage(),
                'email' => $validated['email'],
                'name' => $validated['name'],
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return redirect()->back()
                ->withErrors(['email' => 'Sorry, there was an error sending your message. Please try again or contact us directly at info@diuacm.com.'])
                ->withInput()
                ->with('preserveScroll', true);
        }
    }
}
