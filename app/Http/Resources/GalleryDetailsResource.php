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
            'images' => GalleryMediaResource::collection($this->getMedia('gallery_images'))->resolve(),
        ]);
    }
}
