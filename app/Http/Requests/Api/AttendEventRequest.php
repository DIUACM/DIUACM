<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AttendEventRequest extends FormRequest
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
        return [
            'event_password' => ['required', 'string'],
        ];
    }

    /**
     * Get the custom error messages for the request.
     */
    public function messages(): array
    {
        return [
            'event_password.required' => 'Event password is required to mark attendance.',
        ];
    }
}
