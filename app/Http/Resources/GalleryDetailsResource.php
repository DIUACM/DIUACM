<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class GalleryDetailsResource extends GalleryResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'images' => $this->getMedia('gallery_images')->map(function ($media) {
                return [
                    'url' => $media->getUrl(),
                    'thumbnail' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : $media->getUrl(),
                    'name' => $media->name,
                    'mime_type' => $media->mime_type,
                ];
            })->values()->all(),
        ]);
    }
}
