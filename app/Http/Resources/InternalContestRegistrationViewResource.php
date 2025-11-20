<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
                'student_id_rules' => $this->student_id_rules,
                'student_id_rules_guide' => $this->student_id_rules_guide,
                'pickup_points' => $this->pickup_points,
                'departments' => $this->departments,
                'sections' => $this->sections,
                'lab_teacher_names' => $this->lab_teacher_names,
                'tshirt_sizes' => $this->tshirt_sizes,
            ],
            'tshirt_size_guideline_url' => $this->getFirstMediaUrl('tshirt_size_guideline'),
        ]);
    }
}
