<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProgrammerDetailsResource;
use App\Http\Resources\ProgrammerResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgrammerController extends Controller
{
    /**
     * Display a paginated list of programmers.
     */
    public function index(Request $request): Response
    {
        $programmers = User::query()
            ->select([
                'id',
                'name',
                'username',
                'student_id',
                'department',
                'max_cf_rating',
                'codeforces_handle',
            ])
            ->when($request->get('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('codeforces_handle', 'like', "%{$search}%");
                });
            })
            ->when($request->get('department'), function ($query, $department) {
                $query->where('department', $department);
            })
            ->orderBy('max_cf_rating', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('programmers/index', [
            'programmers' => ProgrammerResource::collection($programmers),
            'filters' => [
                'search' => $request->get('search'),
                'department' => $request->get('department'),
            ],
        ]);
    }

    /**
     * Display the specified programmer's profile.
     */
    public function show(User $user): Response
    {
        // Load tracker performance with all necessary data
        $user->load([
            'rankLists' => function ($query) {
                $query->with([
                    'tracker:id,title,slug',
                    'users' => function ($usersQuery) {
                        $usersQuery->select(['users.id'])
                            ->orderByPivot('score', 'desc');
                    },
                    'events:id',
                ])
                    ->select(['rank_lists.id', 'rank_lists.tracker_id', 'rank_lists.keyword'])
                    ->orderBy('rank_lists.order');
            },
        ]);

        // Load contest participations with team and members
        $user->load([
            'teams' => function ($query) {
                $query->with([
                    'contest:id,name,date',
                    'members' => function ($membersQuery) {
                        $membersQuery->select(['users.id', 'users.name', 'users.username', 'users.student_id', 'users.department']);
                    },
                ])
                    ->select(['teams.id', 'teams.name', 'teams.contest_id', 'teams.rank', 'teams.solve_count'])
                    ->orderBy('teams.created_at', 'desc');
            },
        ]);

        
        return Inertia::render('programmers/show', [
            'programmer' => ProgrammerDetailsResource::make($user)->resolve(),
        ]);
    }
}
