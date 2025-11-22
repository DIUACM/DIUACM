<?php

namespace App\Http\Resources;

use App\Enums\Gender;
use Illuminate\Http\Request;

class InternalContestRegistrationViewResource extends InternalContestResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'form_settings' => [
                'student_id_rules_guide' => $this->student_id_rules_guide,
                'pickup_points' => $this->pickup_points,
                'departments' => $this->departments,
                'sections' => $this->sections,
                'lab_teacher_names' => $this->formatLabTeacherNames(),
                'tshirt_sizes' => $this->tshirt_sizes,
                'genders' => $this->getGenderOptions(),
            ],
            'tshirt_size_guideline_url' => $this->getFirstMediaUrl('tshirt_size_guideline'),
        ]);
    }

    /**
     * Get gender options from Gender enum
     */
    private function getGenderOptions(): array
    {
        return collect(Gender::cases())->map(fn($gender) => $gender->getLabel())->toArray();
    }

    /**
     * Format lab teacher names as "Full Name (Initial)"
     */
    private function formatLabTeacherNames(): ?array
    {
        if (! $this->lab_teacher_names) {
            return null;
        }

        return collect($this->lab_teacher_names)->map(function ($teacher) {
            if (is_array($teacher) && isset($teacher['full_name'], $teacher['initial'])) {
                return "{$teacher['full_name']} ({$teacher['initial']})";
            }

            return $teacher;
        })->toArray();
    }
}
