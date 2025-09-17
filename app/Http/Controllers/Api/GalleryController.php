<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryResource;
use App\Models\Gallery;

class GalleryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $galleries = Gallery::published()
            ->select('id', 'title', 'slug')
            ->with(['media' => fn ($query) => $query->where('collection_name', 'gallery_images')->orderBy('order_column')->limit(1)])
            ->paginate(10);

        return GalleryResource::collection($galleries);
    }

    /**
     * Display the specified resource.
     */
    public function show(Gallery $gallery)
    {
        if ($gallery->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            abort(404);
        }
        $gallery->load(['media' => fn ($query) => $query->where('collection_name', 'gallery_images')]);

        return new GalleryResource($gallery);
    }
}
