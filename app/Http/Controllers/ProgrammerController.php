<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProgrammerController extends Controller
{
    /**
     * Display a listing of programmers with pagination.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 12);

        $query = User::query()
            ->select([
                'id', 'name', 'username', 'image', 'department',
                'student_id', 'max_cf_rating', 'codeforces_handle',
                'atcoder_handle', 'vjudge_handle',
            ])
            ->whereNotNull('username');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        $programmers = $query->orderByDesc('max_cf_rating')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        // Transform image URLs to S3 URLs
        $programmers->getCollection()->transform(function ($programmer) {
            $programmer->image = $programmer->image
                ? Storage::disk('s3')->url($programmer->image)
                : null;

            return $programmer;
        });

        return Inertia::render('Programmers/Index', [
            'programmers' => $programmers,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the specified programmer.
     */
    public function show(User $user): Response
    {
        $user->load([
            'teams.contest',
            'eventUserStats.event',
            'rankLists.tracker',
        ]);

        // Get contest participations through teams
        $contestParticipations = $user->teams()
            ->with(['contest', 'members'])
            ->whereHas('contest')
            ->get()
            ->map(function ($team) {
                return [
                    'contest' => $team->contest,
                    'team' => [
                        'id' => $team->id,
                        'name' => $team->name,
                        'rank' => $team->rank,
                        'solve_count' => $team->solve_count,
                        'members' => $team->members->map(function ($member) {
                            $memberData = $member->only([
                                'id', 'name', 'username', 'image', 'student_id',
                            ]);
                            // Transform image URL to S3 URL
                            $memberData['image'] = $memberData['image']
                                ? Storage::disk('s3')->url($memberData['image'])
                                : null;

                            return [
                                'id' => $member->id,
                                'user' => $memberData,
                            ];
                        }),
                    ],
                ];
            });

        // Get tracker performances through rank lists
        $trackerPerformances = $user->rankLists()
            ->with('tracker')
            ->get()
            ->groupBy('tracker.id')
            ->map(function ($rankLists, $trackerId) {
                $tracker = $rankLists->first()->tracker;

                return [
                    'tracker' => $tracker->only(['id', 'title', 'slug']),
                    'rank_lists' => $rankLists->map(function ($rankList) {
                        return [
                            'rank_list' => $rankList->only(['id', 'keyword']),
                            'score' => $rankList->pivot->score ?? 0,
                            'user_position' => 1, // This would need to be calculated based on actual ranking logic
                            'total_users' => $rankList->users()->count(),
                            'event_count' => $rankList->events()->count(),
                        ];
                    }),
                ];
            })
            ->values();

        // Prepare programmer data with S3 image URL
        $programmerData = $user->only([
            'id', 'name', 'username', 'image', 'department', 'student_id',
            'max_cf_rating', 'codeforces_handle', 'atcoder_handle', 'vjudge_handle',
        ]);
        $programmerData['image'] = $programmerData['image']
            ? Storage::disk('s3')->url($programmerData['image'])
            : null;

        return Inertia::render('Programmers/Show', [
            'programmer' => $programmerData,
            'contest_participations' => $contestParticipations,
            'tracker_performances' => $trackerPerformances,
        ]);
    }
}
