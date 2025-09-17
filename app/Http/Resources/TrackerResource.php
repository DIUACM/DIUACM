<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('trackers.index')) {
            return [
                'title' => $this->title,
                'slug' => $this->slug,
                'description' => $this->description,
            ];
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'order' => $this->order,
            'rank_lists' => $this->rankLists->map(function ($rankList) {
                return [
                    'id' => $rankList->id,
                    'keyword' => $rankList->keyword,
                    'description' => $rankList->description,
                    'weight_of_upsolve' => $rankList->weight_of_upsolve,
                    'order' => $rankList->order,
                    'is_active' => $rankList->is_active,
                    'consider_strict_attendance' => $rankList->consider_strict_attendance,
                ];
            }),
        ];
    }
}
