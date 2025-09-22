<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TrackerController extends Controller
{
    public function index(Request $request): Response
    {
        $trackers = Tracker::query()
            ->select(['id', 'title', 'slug', 'description'])
            ->published()
            ->search($request->get('search'))
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        

        return Inertia::render('trackers/index', [
            'trackers' => $trackers,
            'filters' => [
                'search' => $request->get('search'),
            ],
        ]);
    }

    public function show(Request $request, Tracker $tracker): Response
    {
        // Check if the tracker is published, abort if not
        if ($tracker->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        $tracker->load(['rankLists:id,tracker_id,keyword']);

        $keyword = $request->get('keyword');
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

        // Process users for frontend display
        $processedUsers = $selectedRankList->users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'department' => $user->department,
                'student_id' => $user->student_id,
                'profile_picture' => $user->getFirstMediaUrl('profile_picture', 'thumb'),
                'score' => $user->pivot->score ?? 0,
                'event_stats' => $user->getAttribute('event_stats'),
            ];
        });

        // Prepare available rank lists for switching
        $availableRankLists = $tracker->rankLists->map(function ($rankList) {
            return [
                'id' => $rankList->id,
                'keyword' => $rankList->keyword,
            ];
        });

        return Inertia::render('trackers/show', [
            'tracker' => [
                'id' => $tracker->id,
                'title' => $tracker->title,
                'slug' => $tracker->slug,
            ],
            'selectedRankList' => [
                'id' => $selectedRankList->id,
                'keyword' => $selectedRankList->keyword,
                'consider_strict_attendance' => $selectedRankList->consider_strict_attendance,
                'events' => $selectedRankList->events->toArray(),
                'users' => $processedUsers,
            ],
            'availableRankLists' => $availableRankLists,
        ]);
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
