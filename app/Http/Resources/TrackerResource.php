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
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'rank_lists' => $this->rankLists->map(function ($rankList) {
                return [
                    'keyword' => $rankList->keyword,
                ];
            }),
        ];
    }
}
