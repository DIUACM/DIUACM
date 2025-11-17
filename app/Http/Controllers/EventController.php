<?php

namespace App\Http\Controllers;

use App\Enums\EventType;
use App\Enums\VisibilityStatus;
use App\Http\Requests\StoreEventAttendanceRequest;
use App\Http\Resources\EventDetailsResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Public user columns to select for attendees and performance data.
     */
    private const USER_PUBLIC_COLUMNS = ['id', 'name', 'username', 'student_id', 'department'];

    /**
     * Display a paginated list of published events.
     */
    public function index(Request $request): Response
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
            ->withCount('attendees')
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

    /**
     * Display the specified event with conditional eager loading.
     *
     * Conditionally loads:
     * - Attendees and count if attendance is open
     * - Performance statistics for contest events
     */
    public function show(Event $event): Response
    {
        abort_if($event->status !== VisibilityStatus::PUBLISHED, 404, 'Event not found.');

        $userColumns = array_map(fn ($col) => "users.{$col}", self::USER_PUBLIC_COLUMNS);

        // Load event images
        $event->load('media');

        // Only load attendees count and attendees if attendance is open
        if ($event->open_for_attendance) {
            $event->loadCount('attendees')
                ->load([
                    'attendees' => fn ($attendeesQuery) => $attendeesQuery
                        ->select($userColumns)
                        ->orderBy('event_attendance.created_at', 'desc'),
                ]);
        }

        // Load performance data for contest events
        if ($event->type === EventType::CONTEST) {
            $event->load([
                'usersWithStats' => fn ($statsQuery) => $statsQuery
                    ->select($userColumns)
                    ->orderByDesc('event_user_stats.solve_count')
                    ->orderByDesc('event_user_stats.upsolve_count'),
            ]);
        }
        
        return Inertia::render('events/show', [
            'event' => EventDetailsResource::make($event)->resolve(),
        ]);
    }

    /**
     * Submit attendance for an event.
     */
    public function storeAttendance(StoreEventAttendanceRequest $request, Event $event): \Illuminate\Http\RedirectResponse
    {
        // Add the user to the attendance list
        $event->attendees()->attach($request->user()->id);

        return redirect()
            ->route('events.show', $event)
            ->with('success', 'Attendance confirmed successfully!');
    }
}
