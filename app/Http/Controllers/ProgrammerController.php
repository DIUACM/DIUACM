<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RalphJSmit\Laravel\SEO\Support\SEOData;

class ProgrammerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');

        $programmers = User::query()
            ->with(['media'])
            ->when($search, function ($query, $search) {
                $query->search($search);
            })
            ->orderByDesc('max_cf_rating')
            ->orderBy('name')
            ->paginate(15) // 15 items per page (5 rows × 3 items)
            ->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'student_id' => $user->student_id,
                    'department' => $user->department,
                    'max_cf_rating' => $user->max_cf_rating,
                    'profile_picture' => $user->getFirstMediaUrl('profile_picture', 'thumb'),
                ];
            });

        $seoDescription = $search
            ? "Search results for '{$search}' in programmers. Find competitive programmers from DIU ACM."
            : 'Browse profiles of competitive programmers at DIU ACM. View ratings, contest participations, and performance statistics.';

        return Inertia::render('programmers/index', [
            'programmers' => $programmers,
            'filters' => [
                'search' => $search,
            ],
        ])->withViewData([
            'SEOData' => new SEOData(
                title: $search ? "Search: {$search}" : 'Programmers',
                description: $seoDescription,
            ),
        ]);
    }

    public function show(User $programmer): Response
    {
        $programmer->load([
            'media',
            'teams.contest',
            'teams.members.media',
            'rankLists.tracker',
        ]);

        // Get contest participations through teams
        $contests = $programmer->teams()
            ->with(['contest', 'members.media'])
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->contest->id,
                    'name' => $team->contest->name,
                    'date' => $team->contest->date?->toISOString(),
                    'team_name' => $team->name,
                    'rank' => $team->rank,
                    'solve_count' => $team->solve_count,
                    'members' => $team->members->map(function ($member) {
                        return [
                            'name' => $member->name,
                            'username' => $member->username,
                            'student_id' => $member->student_id,
                            'profile_picture' => $member->getFirstMediaUrl('profile_picture', 'thumb'),
                        ];
                    }),
                ];
            });

        // Get tracker performance
        $trackerPerformance = $programmer->rankLists()
            ->with('tracker')
            ->get()
            ->groupBy('tracker.slug')
            ->map(function ($rankLists, $slug) use ($programmer) {
                $tracker = $rankLists->first()->tracker;

                return [
                    'slug' => $slug,
                    'title' => $tracker->title,
                    'ranklists' => $rankLists->map(function ($rankList) use ($programmer) {
                        // Get user's position and score from the pivot table
                        $userRankData = $rankList->users()
                            ->where('users.id', $programmer->id)
                            ->first();

                        $totalUsers = $rankList->users()->count();
                        $userPosition = null;
                        $userScore = 0;

                        if ($userRankData) {
                            $userScore = $userRankData->pivot->score ?? 0;

                            // Calculate position based on users with higher scores
                            $userPosition = $rankList->users()
                                ->wherePivot('score', '>', $userScore)
                                ->count() + 1;
                        }

                        return [
                            'keyword' => $rankList->keyword,
                            'user_position' => $userPosition,
                            'user_score' => $userScore,
                            'total_users' => $totalUsers,
                            'events_count' => $rankList->events_count ?? 0,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $description = "{$programmer->name}'s competitive programming profile at DIU ACM. View contest participations, performance statistics, and rankings.";

        return Inertia::render('programmers/show', [
            'programmer' => [
                'id' => $programmer->id,
                'name' => $programmer->name,
                'username' => $programmer->username,
                'student_id' => $programmer->student_id,
                'department' => $programmer->department,
                'max_cf_rating' => $programmer->max_cf_rating,
                'codeforces_handle' => $programmer->codeforces_handle,
                'atcoder_handle' => $programmer->atcoder_handle,
                'vjudge_handle' => $programmer->vjudge_handle,
                'profile_picture' => $programmer->getFirstMediaUrl('profile_picture'),
                'contests' => $contests,
                'tracker_performance' => $trackerPerformance,
            ],
        ])->withViewData([
            'SEOData' => new SEOData(
                title: $programmer->name,
                description: $description,
                image: $programmer->getFirstMediaUrl('profile_picture') ?: null,
            ),
        ]);
    }
}
