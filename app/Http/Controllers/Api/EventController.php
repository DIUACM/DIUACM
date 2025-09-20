<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AttendEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $events = Event::published()
            ->select('id', 'title', 'type', 'status', 'starting_at', 'ending_at', 'participation_scope', 'open_for_attendance')
            ->withCount('attendees')
            ->search(request('search'))
            ->ofType(request('type'))
            ->forParticipationScope(request('participation_scope'))
            ->orderBy('starting_at', 'desc')
            ->paginate(10);

        return EventResource::collection($events);
    }

    /**
     * Display the specified resource.
     */
    public function show(Event $event)
    {
        // Check if the event is published, abort if not
        if ($event->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $event->load(['eventUserStats.user:id,name,username,student_id,department', 'eventUserStats.user.media']);

        if ($event->open_for_attendance) {
            $event->load(['attendees:id,name,username,student_id,department', 'attendees.media']);
        }

        return new EventResource($event);
    }

    /**
     * Mark attendance for the specified event.
     */
    public function attend(AttendEventRequest $request, Event $event): JsonResponse
    {
        // Check if the event is published
        if ($event->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            return response()->json([
                'message' => 'Event not found.',
            ], 404);
        }

        // Check if the event is open for attendance
        if (! $event->open_for_attendance) {
            return response()->json([
                'message' => 'This event is not open for attendance.',
            ], 403);
        }

        // Check if the attendance window is currently enabled
        if (! $event->isAttendanceWindowEnabled()) {
            return response()->json([
                'message' => 'Attendance window is currently closed for this event.',
            ], 403);
        }

        // Verify the event password
        if ($request->validated()['event_password'] !== $event->event_password) {
            return response()->json([
                'message' => 'Invalid event password.',
            ], 403);
        }

        $user = Auth::user();

        // Check if the user has already attended this event
        if ($event->attendees()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You have already marked attendance for this event.',
            ], 409);
        }

        // Mark attendance
        $event->attendees()->attach($user->id);

        return response()->json([
            'message' => 'Attendance marked successfully.',
            'data' => [
                'event_id' => $event->id,
                'user_id' => $user->id,
                'attended_at' => now()->toISOString(),
            ],
        ]);
    }
}
