<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\Gallery;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(): Response
    {
        $galleries = Gallery::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Gallery $gallery) => [
                'id' => $gallery->id,
                'title' => $gallery->title,
                'slug' => $gallery->slug,
                'description' => $gallery->description,
                'images_count' => is_array($gallery->attachments) ? count($gallery->attachments) : 0,
                'cover_image' => is_array($gallery->attachments) && ! empty($gallery->attachments)
                    ? '/storage/'.$gallery->attachments[0]
                    : null,
                'created_at' => $gallery->created_at,
            ]);

        return Inertia::render('galleries/index', [
            'galleries' => $galleries,
        ])->withViewData([
            'title' => 'Gallery',
        ]);
    }

    public function show(Gallery $gallery): Response
    {
        // Ensure gallery is published
        if ($gallery->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $galleryData = [
            'id' => $gallery->id,
            'title' => $gallery->title,
            'slug' => $gallery->slug,
            'description' => $gallery->description,
            'images' => is_array($gallery->attachments)
                ? array_map(fn ($attachment) => '/storage/'.$attachment, $gallery->attachments)
                : [],
            'created_at' => $gallery->created_at,
            'updated_at' => $gallery->updated_at,
        ];

        return Inertia::render('galleries/show', [
            'gallery' => $galleryData,
        ])->withViewData([
            'title' => $gallery->title,
        ]);
    }
}
