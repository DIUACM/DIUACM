<?php

namespace App\Http\Requests;

use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $userId = Auth::id();

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'max:255', Rule::unique('users', 'username')->ignore($userId)],
            'email' => ['prohibited'],
            'gender' => ['sometimes', 'string', 'in:'.implode(',', array_column(Gender::cases(), 'value'))],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'codeforces_handle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'atcoder_handle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'vjudge_handle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'student_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'max_cf_rating' => ['prohibited'],
        ];
    }
}
