<?php

namespace App\Http\Resources;

use App\Enums\EventType;
use Illuminate\Http\Request;

class EventDetailsResource extends EventResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description' => $this->description,
            'event_link' => $this->event_link,
            'open_for_attendance' => $this->open_for_attendance,
            'has_attendance_password' => filled($this->event_password),
            'images' => $this->when($this->relationLoaded('media'), function () {
                return $this->getMedia('event_images')->map(function ($media) {
                    return [
                        'url' => $media->getUrl(),
                        'preview_url' => $media->hasGeneratedConversion('medium') ? $media->getUrl('medium') : $media->getUrl(),
                        'mime_type' => $media->mime_type,
                    ];
                });
            }),
            'attendance' => $this->when($this->open_for_attendance && $this->relationLoaded('attendees'), function () {
                return $this->attendees->map(function ($user) {
                    return array_merge(
                        (new PublicUserResource($user))->toArray(request()),
                        ['attended_at' => $user->pivot->created_at]
                    );
                });
            }),
            'performance' => $this->when($this->type === EventType::CONTEST && $this->relationLoaded('usersWithStats'), function () {
                return $this->usersWithStats->map(function ($user) {
                    return array_merge(
                        (new PublicUserResource($user))->toArray(request()),
                        [
                            'solve_count' => $user->pivot->solve_count,
                            'upsolve_count' => $user->pivot->upsolve_count,
                        ]
                    );
                });
            }),
        ]);
    }
}
