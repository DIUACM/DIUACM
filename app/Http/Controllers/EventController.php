<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Http\Resources\EventDetailsResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::query()
            ->select([
                'id',
                'title',
                'starting_at',
                'ending_at',
                'participation_scope',
                'type',
                'open_for_attendance',
            ])
            ->published()
            ->search($request->get('search'))
            ->ofType($request->get('type'))
            ->forParticipationScope($request->get('participation_scope'))
            ->withCount([
                'attendees' => function ($query) {
                    $query->whereColumn('events.open_for_attendance', true);
                },
            ])
            ->orderBy('starting_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('events/index', [
            'events' => EventResource::collection($events),
            'filters' => [
                'search' => $request->get('search'),
                'type' => $request->get('type'),
                'participation_scope' => $request->get('participation_scope'),
            ],
        ]);
    }

    public function show(Event $event)
    {
        if ($event->status !== VisibilityStatus::PUBLISHED) {
            abort(403, 'This event is not published yet.');
        }

        // Build query with conditional eager loading
        $query = Event::where('id', $event->id);

        // Only load attendees count and attendees if attendance is open
        if ($event->open_for_attendance) {
            $query->withCount('attendees')
                ->with([
                    'attendees' => function ($query) {
                        $query->select('users.id', 'users.name', 'users.username', 'users.student_id', 'users.department')
                            ->orderBy('event_attendance.created_at', 'desc');
                    },
                ]);
        }

        // Load performance data for contest events
        if ($event->type->value === 'contest') {
            $query->with([
                'usersWithStats' => function ($query) {
                    $query->select('users.id', 'users.name', 'users.username', 'users.student_id', 'users.department')
                        ->orderByDesc('event_user_stats.solve_count')
                        ->orderByDesc('event_user_stats.upsolve_count');
                },
            ]);
        }

        $event = $query->firstOrFail();

        return new EventDetailsResource($event);
    }
}
