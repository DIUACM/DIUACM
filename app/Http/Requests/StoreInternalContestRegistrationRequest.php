<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInternalContestRegistrationRequest extends FormRequest
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
            'student_id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'section' => ['required', 'string', 'max:255'],
            'lab_teacher_name' => ['required', 'string', 'max:255'],
            'tshirt_size' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', 'in:male,female'],
            'transport_service_required' => ['boolean'],
            'pickup_point' => ['nullable', 'string', 'max:255', 'required_if:transport_service_required,true'],
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
            'student_id.required' => 'Student ID is required.',
            'name.required' => 'Full name is required.',
            'phone.required' => 'Phone number is required.',
            'department.required' => 'Department is required.',
            'section.required' => 'Section is required.',
            'lab_teacher_name.required' => 'Lab teacher name is required.',
            'tshirt_size.required' => 'T-shirt size is required.',
            'gender.required' => 'Gender is required.',
            'gender.in' => 'Gender must be either male or female.',
            'pickup_point.required_if' => 'Pickup point is required when transport service is selected.',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'student_id' => 'Student ID',
            'name' => 'Full Name',
            'phone' => 'Phone Number',
            'department' => 'Department',
            'section' => 'Section',
            'lab_teacher_name' => 'Lab Teacher Name',
            'tshirt_size' => 'T-shirt Size',
            'gender' => 'Gender',
            'pickup_point' => 'Pickup Point',
        ];
    }
}
