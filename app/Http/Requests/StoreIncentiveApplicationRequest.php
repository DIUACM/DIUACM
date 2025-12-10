<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncentiveApplicationRequest extends FormRequest
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
            'full_name' => ['required', 'string', 'max:255'],
            'student_id' => ['required', 'string', 'max:255'],
            'batch' => ['required', 'string', 'max:255'],
            'current_semester' => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:255'],
            'courses' => ['required', 'array', 'min:1'],
            'courses.*.teacher_name' => ['required', 'string', 'max:255'],
            'courses.*.teacher_initial' => ['required', 'string', 'max:255'],
            'courses.*.section' => ['required', 'string', 'max:255'],
            'courses.*.teacher_email' => ['required', 'email', 'max:255'],
            'courses.*.teacher_phone' => ['required', 'string', 'max:255'],
            'courses.*.course_name' => ['required', 'string', 'max:255'],
            'courses.*.course_code' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required' => 'Full name is required.',
            'student_id.required' => 'Student ID is required.',
            'batch.required' => 'Batch is required.',
            'current_semester.required' => 'Current semester is required.',
            'phone_number.required' => 'Phone number is required.',
            'courses.required' => 'At least one course is required.',
            'courses.min' => 'At least one course must be added.',
            'courses.*.teacher_name.required' => 'Teacher name is required for all courses.',
            'courses.*.teacher_initial.required' => 'Teacher initial is required for all courses.',
            'courses.*.section.required' => 'Section is required for all courses.',
            'courses.*.teacher_email.required' => 'Teacher email is required for all courses.',
            'courses.*.teacher_email.email' => 'Teacher email must be a valid email address.',
            'courses.*.teacher_phone.required' => 'Teacher phone is required for all courses.',
            'courses.*.course_name.required' => 'Course name is required for all courses.',
            'courses.*.course_code.required' => 'Course code is required for all courses.',
        ];
    }
}
