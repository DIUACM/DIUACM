<?php

namespace App\Http\Controllers\Api;

use App\Enums\VisibilityStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\TrackerResource;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Support\Facades\DB;

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
        if ($tracker->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $tracker->load(['rankLists:id,tracker_id,keyword']);

        $keyword = request()->get('keyword');
        $selectedRankList = null;
        if ($keyword) {
            $selectedRankList = $tracker->rankLists->firstWhere('keyword', $keyword);
        }
        if (! $selectedRankList) {
            $selectedRankList = $tracker->rankLists->first();
        }
        if (! $selectedRankList) {
            abort(404);
        }
        $selectedRankList = RankList::query()
            ->whereKey($selectedRankList->id)
            ->select('id', 'tracker_id', 'keyword', 'consider_strict_attendance')
            ->firstOrFail();

        $considerStrict = $selectedRankList->consider_strict_attendance;
        $selectedRankList->load([
            'events' => function ($query) use ($considerStrict) {
                $columns = ['events.id', 'title', 'starting_at'];
                if ($considerStrict) {
                    $columns[] = 'strict_attendance';
                }
                $query->where('status', VisibilityStatus::PUBLISHED)
                    ->orderByDesc('starting_at')
                    ->select($columns);
            },
            'users' => function ($query) {
                $query->select('users.id', 'users.name', 'users.username', 'users.department', 'users.student_id');
            },
            'users.media',
        ]);
        $userIds = $selectedRankList->users->pluck('id');
        $eventIds = $selectedRankList->events->pluck('id');

        if ($userIds->isNotEmpty() && $eventIds->isNotEmpty()) {
            $this->processEventStats($selectedRankList, $userIds, $eventIds);
        }

        $selectedRankList->setRelation('users', $selectedRankList->users->sortByDesc(fn ($u) => (float) ($u->pivot->score ?? 0))->values());

        // Attach the selected rank list to the tracker for the resource
        $tracker->setRelation('selectedRankList', $selectedRankList);

        return new TrackerResource($tracker);
    }

    private function processEventStats(RankList $selectedRankList, $userIds, $eventIds): void
    {
        $events = $selectedRankList->events;
        $stats = EventUserStat::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('event_id', $eventIds)
            ->select('event_id', 'user_id', 'solve_count', 'upsolve_count', 'participation')
            ->get()
            ->groupBy('user_id');

        $selectedRankList->users->transform(function ($user) use ($stats, $events) {
            $userStats = $stats->get($user->id, collect());
            $userStatsByEvent = $userStats->keyBy('event_id');
            $mapped = [];
            foreach ($events as $event) {
                $row = $userStatsByEvent->get($event->id);
                if ($row) {
                    $mapped[$event->id] = [
                        'event_id' => $row->event_id,
                        'solve_count' => $row->solve_count,
                        'upsolve_count' => $row->upsolve_count,
                        'participation' => $row->participation,
                    ];
                } else {
                    $mapped[$event->id] = null;
                }
            }
            $user->setAttribute('event_stats', (object) $mapped);

            return $user;
        });

        if ($selectedRankList->consider_strict_attendance) {
            $this->applyStrictAttendance($selectedRankList, $userIds, $events);
        }
    }

    private function applyStrictAttendance(RankList $selectedRankList, $userIds, $events): void
    {
        $strictEventIds = $events->filter(fn ($e) => (bool) ($e->strict_attendance ?? false))->pluck('id');
        if ($strictEventIds->isEmpty()) {
            return;
        }

        $attendance = DB::table('event_attendance')
            ->whereIn('event_id', $strictEventIds)
            ->whereIn('user_id', $userIds)
            ->select('event_id', 'user_id')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->pluck('event_id')->flip());

        $selectedRankList->users->each(function ($user) use ($attendance, $strictEventIds) {
            $userEventStats = (array) $user->getAttribute('event_stats');
            foreach ($strictEventIds as $eventId) {
                $hasAttendance = isset($attendance[$user->id]) && $attendance[$user->id]->has($eventId);
                if (! $hasAttendance && array_key_exists($eventId, $userEventStats) && $userEventStats[$eventId] !== null) {
                    $userEventStats[$eventId]['upsolve_count'] = ($userEventStats[$eventId]['upsolve_count'] ?? 0) + ($userEventStats[$eventId]['solve_count'] ?? 0);
                    $userEventStats[$eventId]['solve_count'] = 0;
                    $userEventStats[$eventId]['participation'] = false;
                }
            }
            $user->setAttribute('event_stats', (object) $userEventStats);
        });
    }
}
