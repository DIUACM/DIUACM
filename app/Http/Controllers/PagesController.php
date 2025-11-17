<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PagesController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('home');
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
