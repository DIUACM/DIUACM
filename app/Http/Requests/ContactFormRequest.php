<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $emailRule = 'email';

        // Only use DNS validation in production
        if (config('app.env') === 'production') {
            $emailRule = 'email:dns';
        }

        return [
            'name' => ['required', 'string', 'max:255', 'min:2', 'regex:/^[a-zA-Z\s\-\'\.]+$/'],
            'email' => ['required', $emailRule, 'max:255'],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
            // Honeypot field - should be empty
            'website' => ['sometimes', 'size:0'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name.',
            'name.min' => 'Name must be at least 2 characters long.',
            'name.max' => 'Name cannot be longer than 255 characters.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, apostrophes, and periods.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email cannot be longer than 255 characters.',
            'message.required' => 'Please enter your message.',
            'message.min' => 'Message must be at least 10 characters long.',
            'message.max' => 'Message cannot be longer than 2000 characters.',
            'website.size' => 'Invalid form submission.',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        // If honeypot field is filled, fail silently to confuse bots
        if ($this->filled('website')) {
            // Log potential spam attempt
            \Illuminate\Support\Facades\Log::warning('Potential spam detected in contact form', [
                'ip' => $this->ip(),
                'user_agent' => $this->userAgent(),
                'honeypot_value' => $this->input('website'),
            ]);

            // Return a fake success to confuse bots
            redirect()->back()->with('success', 'Thank you! Your message has been sent successfully.')->throwResponse();
        }

        parent::failedValidation($validator);
    }
}
