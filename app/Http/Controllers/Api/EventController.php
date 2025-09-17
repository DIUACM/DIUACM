<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;

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

        return new EventResource($event);
    }
}
