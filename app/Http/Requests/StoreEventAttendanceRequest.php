<?php

namespace App\Http\Requests;

use App\Enums\VisibilityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreEventAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.required' => 'Event password is required.',
        ];
    }

    /**
     * Configure the validator instance for additional checks.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $event = $this->route('event');

            // Validate that the event is published
            if ($event->status !== VisibilityStatus::PUBLISHED) {
                $validator->errors()->add('event', 'Event not found.');
            }

            // Check if attendance is enabled for this event
            if (! $event->open_for_attendance) {
                $validator->errors()->add('attendance', 'Attendance is not enabled for this event.');
            }

            // Check if attendance window is enabled
            if (! $event->isAttendanceWindowEnabled()) {
                $validator->errors()->add('attendance', 'Attendance window is not currently open.');
            }

            // Check if user already gave attendance
            if ($event->attendees()->where('user_id', $this->user()->id)->exists()) {
                $validator->errors()->add('attendance', 'You have already given attendance for this event.');
            }

            // Validate password exists
            if (empty($event->event_password)) {
                $validator->errors()->add('attendance', 'Event password is not set. Please contact the event organizer.');
            }

            // Validate password matches
            if (! empty($event->event_password) && $this->password !== $event->event_password) {
                $validator->errors()->add('password', 'Invalid event password.');
            }
        });
    }
}
