<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Mail\ContactFormMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Show the contact form.
     */
    public function index(): Response
    {
        return Inertia::render('contact');
    }

    /**
     * Handle contact form submission.
     */
    public function store(ContactFormRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            // Send email to submissions@diuacm.com
            Mail::to('submissions@diuacm.com')->send(
                new ContactFormMail(
                    senderName: $validated['name'],
                    senderEmail: $validated['email'],
                    messageContent: $validated['message']
                )
            );

            return back()->with('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you within 24-48 hours.');

        } catch (\Exception $e) {
            Log::error('Contact form email failed', [
                'error' => $e->getMessage(),
                'email' => $validated['email'],
                'name' => $validated['name'],
            ]);

            return back()
                ->withErrors(['email' => 'Sorry, there was an error sending your message. Please try again or contact us directly at info@diuacm.com.'])
                ->withInput();
        }
    }
}
