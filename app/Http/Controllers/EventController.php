<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Http\Requests\AttendEventRequest;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = 10;

        $query = Event::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->when($validated['title'] ?? null, function ($q, $title) {
                $q->where('title', 'like', "%{$title}%");
            })
            ->withCount('attendees')
            ->orderByDesc('starting_at');

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('events/index', [
            'events' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'limit' => $paginator->perPage(),
            ],
            'filters' => [
                'title' => $validated['title'] ?? null,
            ],
        ])->withViewData([
            'title' => ($validated['title'] ?? null) ? "Events: {$validated['title']}" : 'Events',
        ]);
    }

    public function show(Event $event): Response
    {
        // Only show published events
        if ($event->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $event->load([
            'attendees' => function ($query) {
                $query->select('users.id', 'users.name', 'users.username', 'users.image', 'users.department', 'users.student_id')
                    ->orderBy('event_attendance.created_at');
            },
            'usersWithStats' => function ($query) {
                $query->select('users.id', 'users.name', 'users.username', 'users.image', 'users.department', 'users.student_id')
                    ->orderByDesc('event_user_stats.solves_count')
                    ->orderByDesc('event_user_stats.upsolves_count');
            },
            'rankLists.tracker' => function ($query) {
                $query->select('id', 'title');
            },
        ]);

        $userHasAttended = false;
        if (Auth::check()) {
            $userHasAttended = $event->attendees->contains('id', Auth::id());
        }

        return Inertia::render('events/show', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'starting_at' => $event->starting_at,
                'ending_at' => $event->ending_at,
                'event_link' => $event->event_link,
                'open_for_attendance' => $event->open_for_attendance,
                'strict_attendance' => $event->strict_attendance,
                'type' => $event->type,
                'participation_scope' => $event->participation_scope,
                'attendees_count' => $event->attendees->count(),
                'attendees' => $event->attendees->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'image_url' => $user->image_url,
                        'department' => $user->department,
                        'student_id' => $user->student_id,
                        'attended_at' => $user->pivot->created_at,
                    ];
                }),
                'users_with_stats' => $event->usersWithStats->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'image_url' => $user->image_url,
                        'department' => $user->department,
                        'student_id' => $user->student_id,
                        'solves_count' => $user->pivot->solves_count ?? 0,
                        'upsolves_count' => $user->pivot->upsolves_count ?? 0,
                        'participation' => $user->pivot->participation ?? null,
                    ];
                }),
                'rank_lists' => $event->rankLists->map(function ($rankList) {
                    return [
                        'id' => $rankList->id,
                        'keyword' => $rankList->keyword,
                        'description' => $rankList->description,
                        'weight' => $rankList->pivot->weight ?? 1,
                        'tracker' => [
                            'id' => $rankList->tracker->id,
                            'title' => $rankList->tracker->title,
                        ],
                    ];
                }),
                'is_attendance_window_enabled' => $event->isAttendanceWindowEnabled(),
                'has_password' => ! empty($event->event_password),
            ],
            'user_has_attended' => $userHasAttended,
        ])->withViewData([
            'title' => $event->title,
        ]);
    }

    public function attend(AttendEventRequest $request, Event $event)
    {
        // Check if event is published
        if ($event->status !== VisibilityStatus::PUBLISHED) {
            abort(404, 'Event not found.');
        }

        // Check if attendance is open
        if (! $event->open_for_attendance) {
            return redirect()->back()->withErrors(['message' => 'Attendance is not enabled for this event.']);
        }

        // Check if attendance window is enabled
        if (! $event->isAttendanceWindowEnabled()) {
            return redirect()->back()->withErrors(['message' => 'Attendance window is closed.']);
        }

        // Check if event has password
        if (empty($event->event_password)) {
            return redirect()->back()->withErrors(['message' => 'Please ask the admin to set a password for this event.']);
        }

        // Validate password
        $validated = $request->validated();

        if ($validated['password'] !== $event->event_password) {
            return redirect()->back()->withErrors(['password' => 'Invalid event password.']);
        }

        // Check if user already attended
        if ($event->attendees()->where('user_id', Auth::id())->exists()) {
            return redirect()->back()->withErrors(['message' => 'You have already marked attendance for this event.']);
        }

        // Mark attendance
        $event->attendees()->attach(Auth::id());

        return redirect()->back()->with('success', 'Attendance marked successfully!');
    }
}
