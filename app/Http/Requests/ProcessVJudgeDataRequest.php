<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessVJudgeDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'length' => 'required|integer|min:0',
            'participants' => 'required|array',
            'participants.*' => 'required|array',
            'participants.*.0' => 'required|string', // username
            'participants.*.1' => 'required|string', // nickname
            'participants.*.2' => 'nullable|string', // avatar URL (optional)
            'submissions' => 'nullable|array',
            'submissions.*' => 'array|size:4',
            'submissions.*.0' => 'required|integer', // participantId
            'submissions.*.1' => 'required|integer', // problemIndex
            'submissions.*.2' => 'required|integer|in:0,1', // isAccepted
            'submissions.*.3' => 'required|integer', // timestamp
        ];
    }

    public function messages(): array
    {
        return [
            'length.required' => 'Contest length is required',
            'length.integer' => 'Contest length must be an integer',
            'participants.required' => 'Participants data is required',
            'participants.array' => 'Participants must be an array',
            'submissions.array' => 'Submissions must be an array',
            'submissions.*.2.in' => 'Accepted status must be 0 or 1',
        ];
    }
}
