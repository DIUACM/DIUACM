<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse as BaseJsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TrackerController extends Controller
{
    public function index(): Response
    {
        $trackers = Tracker::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->withCount('rankLists')
            ->orderBy('order')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Tracker $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'slug' => $t->slug,
                'description' => $t->description,
                'ranklists_count' => $t->rank_lists_count ?? $t->rank_lists_count ?? $t->ranklists_count ?? $t->rank_lists_count,
            ]);

        return Inertia::render('trackers/index', [
            'trackers' => $trackers,
        ]);
    }

    public function show(Request $request, string $slug, ?string $keyword = null): BaseJsonResponse
    {
        $cacheKey = 'tracker_show:'.$slug.':'.($keyword ?: '_');

        $payload = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($slug, $keyword) {
            $tracker = Tracker::where('slug', $slug)
                ->where('status', VisibilityStatus::PUBLISHED)
                ->with([
                    'rankLists' => function ($query) {
                        $query->where('status', VisibilityStatus::PUBLISHED)
                            ->select('id', 'tracker_id', 'keyword');
                    },
                ])
                ->select('id', 'title')
                ->firstOrFail();

            $selectedRankList = null;
            if ($keyword) {
                $selectedRankList = $tracker->rankLists->firstWhere('keyword', $keyword);
            }
            if (! $selectedRankList) {
                $selectedRankList = $tracker->rankLists->first();
            }

            if ($selectedRankList) {
                $selectedRankList = RankList::query()
                    ->whereKey($selectedRankList->id)
                    ->select('id', 'tracker_id', 'keyword', 'consider_strict_attendance')
                    ->first();

                if ($selectedRankList) {
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
                            $query->select('users.id', 'users.name', 'users.username', 'users.image');
                        },
                    ]);

                    $selectedRankList->users->each(function ($user) {
                        $user->append('image_url');
                        $user->makeHidden(['image']);
                    });

                    $userIds = $selectedRankList->users->pluck('id');
                    $eventIds = $selectedRankList->events->pluck('id');

                    if ($userIds->isNotEmpty() && $eventIds->isNotEmpty()) {
                        $events = $selectedRankList->events;
                        $stats = EventUserStat::query()
                            ->whereIn('user_id', $userIds)
                            ->whereIn('event_id', $eventIds)
                            ->select('event_id', 'user_id', 'solves_count', 'upsolves_count', 'participation')
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
                                        'solves_count' => $row->solves_count,
                                        'upsolves_count' => $row->upsolves_count,
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
                            $events = $selectedRankList->events; // reuse
                            $strictEventIds = $events->filter(fn ($e) => (bool) ($e->strict_attendance ?? false))->pluck('id');
                            if ($strictEventIds->isNotEmpty()) {
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
                                            $userEventStats[$eventId]['upsolves_count'] = ($userEventStats[$eventId]['upsolves_count'] ?? 0) + ($userEventStats[$eventId]['solves_count'] ?? 0);
                                            $userEventStats[$eventId]['solves_count'] = 0;
                                            $userEventStats[$eventId]['participation'] = false;
                                        }
                                    }
                                    $user->setAttribute('event_stats', (object) $userEventStats);
                                });
                            }
                        }
                    }

                    $selectedRankList->setRelation('users', $selectedRankList->users->sortByDesc(fn ($u) => (float) ($u->pivot->score ?? 0))->values());
                }
            }

            $trackerPayload = [
                'i' => $tracker->id,
                't' => $tracker->title,
            ];

            $rankListPayload = null;
            if ($selectedRankList) {
                $rankListPayload = [
                    'i' => $selectedRankList->id,
                    'k' => $selectedRankList->keyword,
                    'csa' => (bool) $selectedRankList->consider_strict_attendance,
                    'e' => $selectedRankList->events->map(function ($event) use ($selectedRankList) {
                        $data = [
                            'i' => $event->id,
                            't' => $event->title,
                            's' => $event->starting_at,
                        ];
                        if ($selectedRankList->consider_strict_attendance && isset($event->strict_attendance)) {
                            $data['sa'] = (bool) $event->strict_attendance;
                        }

                        return $data;
                    })->values(),
                    'u' => $selectedRankList->users->map(function ($user) {
                        $eventStats = (array) $user->getAttribute('event_stats');
                        $mappedStats = [];
                        foreach ($eventStats as $eventId => $stat) {
                            if ($stat === null) {
                                $mappedStats[$eventId] = null;
                            } else {
                                $mappedStats[$eventId] = [
                                    'sc' => $stat['solves_count'] ?? 0,
                                    'uc' => $stat['upsolves_count'] ?? 0,
                                    'p' => (bool) ($stat['participation'] ?? false),
                                ];
                            }
                        }

                        return [
                            'i' => $user->id,
                            'n' => $user->name,
                            'un' => $user->username,
                            'im' => $user->image_url,
                            'sc' => $user->pivot->score,
                            'es' => (object) $mappedStats,
                        ];
                    })->values(),
                ];
            }

            return [
                't' => $trackerPayload,
                'rl' => $rankListPayload,
            ];
        });

        return response()->json($payload);
    }
}
