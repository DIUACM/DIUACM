<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('welcome');
    }

    public function about(): Response
    {
        return Inertia::render('about');
    }

    public function privacyPolicy(): Response
    {
        return Inertia::render('privacy-policy');
    }

    public function termsAndConditions(): Response
    {
        return Inertia::render('terms-and-conditions');
    }

    public function contact(): Response
    {
        return Inertia::render('contact');
    }
}
