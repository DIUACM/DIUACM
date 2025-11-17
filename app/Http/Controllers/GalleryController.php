<?php

namespace App\Http\Controllers;

use App\Http\Resources\GalleryDetailsResource;
use App\Http\Resources\GalleryResource;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    /**
     * Display a paginated list of published galleries.
     */
    public function index(Request $request): Response
    {
        $galleries = Gallery::query()
            ->select([
                'id',
                'title',
                'slug',
                'description',
                'created_at',
            ])
            ->published()
            ->when($request->get('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('gallery/index', [
            'galleries' => GalleryResource::collection($galleries),
            'filters' => [
                'search' => $request->get('search'),
            ],
        ]);
    }

    /**
     * Display the specified gallery.
     */
    public function show(Gallery $gallery): Response
    {
        // Only show published galleries
        abort_if($gallery->status->value !== 'published', 404, 'Gallery not found.');

        // Load media
        $gallery->load('media');

        return Inertia::render('gallery/show', [
            'gallery' => GalleryDetailsResource::make($gallery)->resolve(),
        ]);
    }
}
