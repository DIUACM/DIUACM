<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($request->routeIs('galleries.index')) {
        ;

            return [
                'title' => $this->title,
                'slug' => $this->slug,
                'cover_image' => $this->getFirstMediaUrl('gallery_images'), // will return fallback if no image
            ];
        }

        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'media' => $this->getMedia('gallery_images')->map(function ($media) {
                return [
                    'url' => $media->getFullUrl(),
                ];
            }),
        ];
    }
}
