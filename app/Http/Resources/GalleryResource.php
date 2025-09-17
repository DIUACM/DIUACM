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
            $coverImage = $this->getFirstMedia('gallery_images');
            return [
                'id' => $this->id,
                'title' => $this->title,
                'slug' => $this->slug,
                'cover_image' => $coverImage ? [
                    'url' => $coverImage->getFullUrl(),
                ] : null,
            ];
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'media' => $this->whenLoaded('media', function () {
                return $this->getMedia('gallery_images')->map(function ($media) {
                    return [
                        'url' => $media->getFullUrl(),
                    ];
                });
            }),
        ];
    }
}
