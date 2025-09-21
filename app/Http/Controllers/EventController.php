<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->published()
            ->search($request->get('search'))
            ->ofType($request->get('type'))
            ->forParticipationScope($request->get('participation_scope'))
            ->withCount('attendees')
            ->orderBy('starting_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('events/index', [
            'events' => $events,
            'filters' => [
                'search' => $request->get('search'),
                'type' => $request->get('type'),
                'participation_scope' => $request->get('participation_scope'),
            ],
        ]);
    }
}
