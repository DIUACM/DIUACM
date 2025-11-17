<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Http\Resources\TrackerDetailsResource;
use App\Http\Resources\TrackerResource;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TrackerController extends Controller
{
    public function index(): Response
    {
        $trackers = Tracker::query()
            ->published()
            ->orderBy('order')
            ->orderBy('title')
            ->select('id', 'title', 'slug', 'description')
            ->get();

        return Inertia::render('trackers/index', [
            'trackers' => TrackerResource::collection($trackers),
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $keyword = $request->get('keyword', '');

        // Create cache key based on slug and keyword
        $cacheKey = "tracker_show_{$slug}_{$keyword}";

        $cachedData = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($slug, $keyword) {
            // Find tracker by slug
            $tracker = Tracker::query()
                ->where('slug', $slug)
                ->where('status', VisibilityStatus::PUBLISHED)
                ->firstOrFail();

            $tracker->load(['rankLists:id,tracker_id,keyword']);

            $selectedRankList = null;
            if ($keyword) {
                $selectedRankList = $tracker->rankLists->firstWhere('keyword', $keyword);
            }
            if (! $selectedRankList) {
                $selectedRankList = $tracker->rankLists->first();
            }
            if (! $selectedRankList) {
                $tracker->selectedRankList = null;
                $tracker->availableRankLists = [];

                return $tracker;
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

            $tracker->selectedRankList = $selectedRankList;
            $tracker->availableRankLists = $tracker->rankLists;

            return $tracker;
        });

        return Inertia::render('trackers/show', TrackerDetailsResource::make($cachedData)->resolve());
    }

    public function export(Request $request, string $slug)
    {
        $keyword = $request->get('keyword', '');
        $format = $request->get('format', 'json');

        $tracker = Tracker::query()
            ->where('slug', $slug)
            ->where('status', VisibilityStatus::PUBLISHED)
            ->firstOrFail();

        $tracker->load(['rankLists:id,tracker_id,keyword']);

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
        ]);

        $userIds = $selectedRankList->users->pluck('id');
        $eventIds = $selectedRankList->events->pluck('id');

        if ($userIds->isNotEmpty() && $eventIds->isNotEmpty()) {
            $this->processEventStats($selectedRankList, $userIds, $eventIds);
        }

        $selectedRankList->setRelation('users', $selectedRankList->users->sortByDesc(fn ($u) => (float) ($u->pivot->score ?? 0))->values());

        $exportData = [
            'tracker' => [
                'title' => $tracker->title,
                'slug' => $tracker->slug,
                'ranklist' => $selectedRankList->keyword,
            ],
            'users' => $selectedRankList->users->map(function ($user, $index) use ($selectedRankList) {
                $userData = [
                    'rank' => $index + 1,
                    'name' => $user->name,
                    'username' => $user->username,
                    'student_id' => $user->student_id,
                    'department' => $user->department,
                    'score' => $user->pivot->score ?? 0,
                ];

                $eventStats = (array) $user->getAttribute('event_stats');
                foreach ($selectedRankList->events as $event) {
                    $stat = $eventStats[$event->id] ?? null;
                    $userData["event_{$event->id}_solves"] = $stat ? $stat['solve_count'] : 0;
                    $userData["event_{$event->id}_upsolves"] = $stat ? $stat['upsolve_count'] : 0;
                    $userData["event_{$event->id}_participation"] = $stat ? $stat['participation'] : false;
                }

                return $userData;
            }),
            'events' => $selectedRankList->events->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'starting_at' => $event->starting_at,
                ];
            }),
        ];

        if ($format === 'csv') {
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$tracker->slug}_{$selectedRankList->keyword}.csv\"",
            ];

            $callback = function () use ($exportData, $selectedRankList) {
                $file = fopen('php://output', 'w');

                // CSV Headers
                $headerRow = ['Rank', 'Name', 'Username', 'Student ID', 'Department', 'Score'];
                foreach ($selectedRankList->events as $event) {
                    $headerRow[] = "{$event->title} - Solves";
                    $headerRow[] = "{$event->title} - Upsolves";
                    $headerRow[] = "{$event->title} - Participation";
                }
                fputcsv($file, $headerRow);

                // CSV Data
                foreach ($exportData['users'] as $userData) {
                    fputcsv($file, array_values($userData));
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        // Default to JSON
        return response()->json($exportData);
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
