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
        // Load the event with basic details
        $event = Event::query()
            ->where('id', $event->id)
            ->where('status', 'published') // Only show published events
            ->firstOrFail();

        $data = ['event' => $event];

        // If attendance is enabled, load attendance data
        if ($event->open_for_attendance) {
            $attendees = $event->attendees()
                ->select([
                    'users.id',
                    'users.name',
                    'users.username',
                    'users.student_id',
                    'users.department',
                ])
                ->withPivot('created_at as attended_at')
                ->orderBy('event_attendance.created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    // Get profile picture URL
                    $profilePicture = $user->getFirstMediaUrl('profile_picture', 'thumb');

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'student_id' => $user->student_id,
                        'department' => $user->department,
                        'profile_picture' => $profilePicture,
                        'attended_at' => $user->pivot->attended_at,
                    ];
                });

            $data['attendees'] = $attendees;
            $data['attendees_count'] = $attendees->count();
        }

        // If it's a contest, load performance data
        if ($event->type === \App\Enums\EventType::CONTEST) {
            $performanceData = $event->eventUserStats()
                ->with([
                    'user' => function ($query) {
                        $query->select([
                            'id',
                            'name',
                            'username',
                            'student_id',
                            'department',
                        ]);
                    },
                ])
                ->orderBy('solve_count', 'desc')
                ->orderBy('upsolve_count', 'desc')
                ->get()
                ->map(function ($stat) {
                    // Get profile picture URL
                    $profilePicture = $stat->user->getFirstMediaUrl('profile_picture', 'thumb');

                    return [
                        'user' => [
                            'id' => $stat->user->id,
                            'name' => $stat->user->name,
                            'username' => $stat->user->username,
                            'student_id' => $stat->user->student_id,
                            'department' => $stat->user->department,
                            'profile_picture' => $profilePicture,
                        ],
                        'solve_count' => $stat->solve_count,
                        'upsolve_count' => $stat->upsolve_count,
                        'participation' => $stat->participation,
                        'total_count' => $stat->solve_count + $stat->upsolve_count,
                    ];
                });

            $data['performance_data'] = $performanceData;
            $data['performance_count'] = $performanceData->count();
        }

        return Inertia::render('events/show', $data);
    }
}
