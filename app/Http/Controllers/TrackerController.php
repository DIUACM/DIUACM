<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\EventUserStat;
use App\Models\RankList;
use App\Models\Tracker;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

    public function show(Request $request, string $slug, ?string $keyword = null): Response
    {
        $tracker = Tracker::query()
            ->where('slug', $slug)
            ->where('status', VisibilityStatus::PUBLISHED)
            ->first();

        if ($tracker === null) {
            abort(404);
        }

        $rankLists = $tracker->rankLists()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->orderBy('order')
            ->get();

        $allKeywords = $rankLists->pluck('keyword')->map(fn ($k) => (string) ($k ?? ''))->values()->all();

        // Resolve current ranklist by keyword (empty string means main)
        $currentRankList = $this->resolveRankList($rankLists, $keyword);

        if ($currentRankList === null) {
            return Inertia::render('trackers/show', [
                'tracker' => [
                    'id' => $tracker->id,
                    'title' => $tracker->title,
                    'slug' => $tracker->slug,
                    'description' => $tracker->description,
                ],
                'not_found' => [
                    'type' => 'ranklist_not_found',
                    'requested_keyword' => $keyword ?? '',
                    'available_ranklists' => $rankLists->map(function (RankList $r) {
                        return [
                            'id' => $r->id,
                            'keyword' => $r->keyword,
                            'description' => $r->description,
                        ];
                    })->values()->all(),
                ],
            ]);
        }

        // Eager load events with pivot (weight), attendees (for strict attendance), and users
        $currentRankList->load([
            'events' => function ($q) {
                $q->orderBy('starting_at');
            },
            'events.attendees:id',
            'users' => function ($q) {
                $q->select('users.id', 'users.name', 'users.username', 'users.image');
            },
        ]);

        // Build attendance map when strict attendance is considered
        $attendanceMap = [];
        if ($currentRankList->consider_strict_attendance) {
            foreach ($currentRankList->events as $event) {
                if ($event->open_for_attendance && $event->strict_attendance) {
                    foreach ($event->attendees as $attendee) {
                        $attendanceMap[$attendee->id.'_'.$event->id] = true;
                    }
                }
            }
        }

        // Fetch user solve stats for all users across events
        $userIds = $currentRankList->users->pluck('id')->all();
        $eventIds = $currentRankList->events->pluck('id')->all();

        $stats = EventUserStat::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('event_id', $eventIds)
            ->get()
            ->groupBy(fn ($s) => $s->user_id.'_'.$s->event_id);

        // Compose response structures inspired by the provided design
        $eventsPayload = $currentRankList->events->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'starting_at' => $event->starting_at,
                'weight' => $event->pivot->weight ?? 1,
                'open_for_attendance' => (bool) $event->open_for_attendance,
                'strict_attendance' => (bool) $event->strict_attendance,
            ];
        })->values();

        $usersPayload = $currentRankList->users
            ->map(function ($user) use ($currentRankList, $stats) {
                $solveStats = collect();
                foreach ($currentRankList->events as $event) {
                    $key = $user->id.'_'.$event->id;
                    /** @var \App\Models\EventUserStat|null $s */
                    $s = $stats->get($key)?->first();
                    $solveStats->push([
                        'event_id' => $event->id,
                        'participation' => $s?->participation ?? null,
                        'solve_count' => (int) ($s?->solves_count ?? 0),
                        'upsolve_count' => (int) ($s?->upsolves_count ?? 0),
                    ]);
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'image_url' => $user->image_url,
                    'score' => (float) ($user->pivot->score ?? 0),
                    'solve_stats' => $solveStats->all(),
                ];
            })
            ->sortByDesc('score')
            ->values();

        return Inertia::render('trackers/show', [
            'tracker' => [
                'id' => $tracker->id,
                'title' => $tracker->title,
                'slug' => $tracker->slug,
                'description' => $tracker->description,
            ],
            'current_ranklist' => [
                'id' => $currentRankList->id,
                'keyword' => $currentRankList->keyword,
                'description' => $currentRankList->description,
                'weight_of_upsolve' => (float) $currentRankList->weight_of_upsolve,
                'consider_strict_attendance' => (bool) $currentRankList->consider_strict_attendance,
                'event_count' => $currentRankList->events->count(),
                'user_count' => $currentRankList->users->count(),
                'events' => $eventsPayload,
                'users' => $usersPayload,
            ],
            'all_ranklist_keywords' => $allKeywords,
            'attendance_map' => $attendanceMap,
        ]);
    }

    private function resolveRankList(Collection $rankLists, ?string $keyword): ?RankList
    {
        if ($rankLists->isEmpty()) {
            return null;
        }

        if ($keyword === null) {
            // Prefer active ranklist without keyword or the first active
            $active = $rankLists->firstWhere('is_active', true);

            return $active ?? $rankLists->first();
        }

        return $rankLists->first(function (RankList $r) use ($keyword) {
            return (string) ($r->keyword ?? '') === $keyword;
        });
    }
}
