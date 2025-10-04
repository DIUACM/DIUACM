<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use RalphJSmit\Laravel\SEO\Support\SEOData;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('welcome')->withViewData([
            'SEOData' => new SEOData(
                title: 'DIU ACM | The Competitive Programming Community of DIU',
                description: 'Join DIU ACM, the premier competitive programming community at Daffodil International University. Participate in contests, improve your skills, and connect with fellow programmers.',
            ),
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('about')->withViewData([
            'SEOData' => new SEOData(
                title: 'About Us',
                description: 'Learn about DIU ACM, our mission, vision, and the team behind the premier competitive programming community at Daffodil International University.',
            ),
        ]);
    }

    public function privacyPolicy(): Response
    {
        return Inertia::render('privacy-policy')->withViewData([
            'SEOData' => new SEOData(
                title: 'Privacy Policy',
                description: 'Read our privacy policy to understand how DIU ACM collects, uses, and protects your personal information.',
            ),
        ]);
    }

    public function termsAndConditions(): Response
    {
        return Inertia::render('terms-and-conditions')->withViewData([
            'SEOData' => new SEOData(
                title: 'Terms and Conditions',
                description: 'Review the terms and conditions for using the DIU ACM platform and participating in our community.',
            ),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('contact')->withViewData([
            'SEOData' => new SEOData(
                title: 'Contact Us',
                description: 'Get in touch with DIU ACM. Send us your questions, feedback, or suggestions and we\'ll get back to you.',
            ),
        ]);
    }
}
