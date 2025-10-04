<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use RalphJSmit\Laravel\SEO\Support\SEOData;


class EventController extends Controller
{
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
                'status', // needed for published() scope
                'description', // needed for search() scope
                'event_link', // needed for search() scope
            ])
            ->published()
            ->search($request->get('search'))
            ->ofType($request->get('type'))
            ->forParticipationScope($request->get('participation_scope'))
            ->withCount('attendees')
            ->orderBy('starting_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Hide fields that were only needed for query scopes
        $events->getCollection()->makeHidden(['status', 'description', 'event_link']);

        return Inertia::render('events/index', [
            'events' => $events,
            'filters' => [
                'search' => $request->get('search'),
                'type' => $request->get('type'),
                'participation_scope' => $request->get('participation_scope'),
            ],
        ]);
    }

    public function show(Event $event): Response
    {
        // Load the event with optimized query - only select needed fields
        $event = Event::query()
            ->select([
                'id', 'title', 'description', 'status', 'starting_at', 'ending_at',
                'event_link', 'event_password', 'open_for_attendance', 'strict_attendance',
                'auto_update_score', 'type', 'participation_scope', 'created_at', 'updated_at',
            ])
            ->where('id', $event->id)
            ->where('status', 'published') // Only show published events
            ->firstOrFail();

        $data = ['event' => $event];

        // Add authentication status
        $user = Auth::user();
        $data['auth'] = [
            'user' => $user,
        ];

        // Check if attendance window is currently enabled
        $isAttendanceWindowEnabled = $event->isAttendanceWindowEnabled();

        // Calculate attendance window times only if attendance is open
        $attendanceWindowStart = null;
        $attendanceWindowEnd = null;
        if ($event->open_for_attendance && $event->starting_at && $event->ending_at) {
            $attendanceWindowStart = $event->starting_at->copy()->subMinutes(15);
            $attendanceWindowEnd = $event->ending_at->copy()->addMinutes(20);
        }

        // Add attendance-related data for authenticated users
        $userAlreadyAttended = false;
        if ($user) {
            $userAlreadyAttended = $event->attendees()
                ->where('user_id', $user->id)
                ->exists();
        }

        // Build attendance info with detailed state information
        $attendanceInfo = [
            'user_already_attended' => $userAlreadyAttended,
            'attendance_window_enabled' => $isAttendanceWindowEnabled,
            'attendance_window_start' => $attendanceWindowStart?->toISOString(),
            'attendance_window_end' => $attendanceWindowEnd?->toISOString(),
        ];

        // Include password info when attendance is enabled (regardless of window timing)
        if ($event->open_for_attendance) {
            $attendanceInfo['has_password'] = ! empty($event->event_password);

            // Add detailed timing state for better button logic
            $now = now();
            if ($now < $attendanceWindowStart) {
                $attendanceInfo['state'] = 'before_window';
            } elseif ($now > $attendanceWindowEnd) {
                $attendanceInfo['state'] = 'after_window';
            } else {
                $attendanceInfo['state'] = 'during_window';
            }
        }

        $data['attendance_info'] = $attendanceInfo;

        // If attendance is enabled, load attendance data efficiently
        if ($event->open_for_attendance) {
            $data = array_merge($data, $this->getAttendanceData($event));
        }

        // If it's a contest, load performance data efficiently
        if ($event->type === \App\Enums\EventType::CONTEST) {
            $data = array_merge($data, $this->getPerformanceData($event));
        }
        
        return Inertia::render('events/show', $data)->withViewData([
            'SEOData' => new SEOData(
                title: $event->title,
                description: $event->description,
            ),
        ]);
    }

    /**
     * Get preprocessed attendance data for the event.
     */
    private function getAttendanceData(Event $event): array
    {
        $attendees = $event->attendees()
            ->select([
                'users.id',
                'users.name',
                'users.username',
                'users.student_id',
                'users.department',
            ])
            ->withPivot('created_at')
            ->orderBy('event_attendance.created_at', 'desc')
            ->get();

        $processedAttendees = $attendees->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'student_id' => $user->student_id,
                'department' => $user->department,
                'profile_picture' => $user->getFirstMediaUrl('profile_picture', 'thumb'),
                'attended_at' => $user->pivot->created_at->toISOString(),
            ];
        });

        return [
            'attendees' => $processedAttendees,
            'attendees_count' => $processedAttendees->count(),
        ];
    }

    /**
     * Get preprocessed performance data for the event.
     */
    private function getPerformanceData(Event $event): array
    {
        $performanceStats = $event->eventUserStats()
            ->with([
                'user:id,name,username,student_id,department',
            ])
            ->select([
                'user_id',
                'solve_count',
                'upsolve_count',
                'participation',
            ])
            ->orderBy('solve_count', 'desc')
            ->orderBy('upsolve_count', 'desc')
            ->get();

        $processedPerformance = $performanceStats->map(function ($stat) {
            return [
                'user' => [
                    'id' => $stat->user->id,
                    'name' => $stat->user->name,
                    'username' => $stat->user->username,
                    'student_id' => $stat->user->student_id,
                    'department' => $stat->user->department,
                    'profile_picture' => $stat->user->getFirstMediaUrl('profile_picture', 'thumb'),
                ],
                'solve_count' => $stat->solve_count,
                'upsolve_count' => $stat->upsolve_count,
                'participation' => $stat->participation,
                'total_count' => $stat->solve_count + $stat->upsolve_count,
            ];
        });

        return [
            'performance_data' => $processedPerformance,
            'performance_count' => $processedPerformance->count(),
        ];
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
        if ($event->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
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
