<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryMediaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'url' => $this->getUrl(),
            'thumbnail' => $this->hasGeneratedConversion('thumb') ? $this->getUrl('thumb') : $this->getUrl(),
            'name' => $this->name,
            'mime_type' => $this->mime_type,
        ];
    }
}
