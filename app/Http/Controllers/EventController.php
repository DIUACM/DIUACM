<?php

namespace App\Http\Controllers;

use App\Enums\EventType;
use App\Enums\VisibilityStatus;
use App\Http\Resources\EventDetailsResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
    public function show(Event $event): EventDetailsResource
    {
        abort_if($event->status !== VisibilityStatus::PUBLISHED, 404, 'Event not found.');

        $userColumns = array_map(fn ($col) => "users.{$col}", self::USER_PUBLIC_COLUMNS);

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

        return new EventDetailsResource($event);
    }

     /**
     * Submit attendance for an event.
     */
    public function storeAttendance(Request $request, Event $event)
    {
        // Ensure user is authenticated
        if (! Auth::check()) {
            abort(401, 'You must be logged in to give attendance.');
        }

        // Validate that the event is published
        if ($event->status !== VisibilityStatus::PUBLISHED) {
            abort(404, 'Event not found.');
        }

        // Check if attendance is enabled for this event
        if (! $event->open_for_attendance) {
            return back()->withErrors(['attendance' => 'Attendance is not enabled for this event.']);
        }

        // Check if attendance window is enabled
        if (! $event->isAttendanceWindowEnabled()) {
            return back()->withErrors(['attendance' => 'Attendance window is not currently open.']);
        }

        // Check if user already gave attendance
        $userId = Auth::id();
        if ($event->attendees()->where('user_id', $userId)->exists()) {
            return back()->withErrors(['attendance' => 'You have already given attendance for this event.']);
        }

        // Only check password during attendance window - validate password exists and matches
        if (empty($event->event_password)) {
            return back()->withErrors(['attendance' => 'Event password is not set. Please contact the event organizer.']);
        }

        // Validate the password input
        $request->validate([
            'password' => 'required|string',
        ]);

        if ($request->password !== $event->event_password) {
            return back()->withErrors(['password' => 'Invalid event password.']);
        }

        // Add the user to the attendance list
        $event->attendees()->attach($userId);

        return back()->with('success', 'Attendance confirmed successfully!');
    }
}
