<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrackerResource;
use App\Models\Tracker;

class TrackerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $trackers = Tracker::published()
            ->select('title', 'slug', 'description')
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return TrackerResource::collection($trackers);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tracker $tracker)
    {
        // Check if the tracker is published, abort if not
        if ($tracker->status !== \App\Enums\VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $tracker->load(['rankLists' => function ($query) {
            $query->orderBy('order')->orderBy('created_at', 'desc');
        }]);

        return new TrackerResource($tracker);
    }
}
