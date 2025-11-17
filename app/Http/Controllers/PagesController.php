<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\Gallery;
use Inertia\Inertia;
use Inertia\Response;

class PagesController extends Controller
{
    public function home(): Response
    {
        $gallery = Gallery::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->where('show_in_homepage', true)
            ->latest('created_at')
            ->first();

        $carouselSlides = [];

        if ($gallery) {
            $images = $gallery->getMedia('gallery_images');

            foreach ($images as $image) {
                $carouselSlides[] = [
                    'image' => $image->getUrl(),
                    'alt' => $gallery->description ?? $gallery->title,
                ];
            }
        }

        return Inertia::render('home', [
            'carouselSlides' => $carouselSlides,
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('about');
    }

    public function privacy(): Response
    {
        return Inertia::render('privacy-policy');
    }

    public function terms(): Response
    {
        return Inertia::render('terms-and-conditions');
    }
}
