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
            ->hasProgrammingHandle()
            ->search($request->get('search'))
            ->when($request->get('department'), function ($query, $department) {
                $query->where('department', $department);
            })
            ->orderBy('max_cf_rating', 'desc')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('programmers/index', [
            'programmers' => $programmers->through(fn ($user) => ProgrammerResource::make($user)->resolve()),
            'filters' => [
                'search' => $request->get('search'),
                'department' => $request->get('department'),
            ],
        ]);
    }

    /**
     * Display the specified programmer's profile.
     */
    public function show(User $user)
    {
        $user->load([
            'rankLists' => function ($query) {
                $query->withPivot('score', 'position')
                    ->withCount([
                        'events as event_count',
                        'users as total_user_count',
                    ])
                    ->with('tracker:id,title,slug');
            },
            'teams' => function ($query) {
                $query->with([
                    'contest:id,name,contest_type,location,date,standings_url',
                    'members:id,name,username,student_id,department',
                ])
                    ->orderBy('created_at', 'desc');
            },
            'jobExperiences' => function ($query) {
                $query->recent();
            },
        ]);

        return Inertia::render('programmers/show', [
            'programmer' => ProgrammerDetailsResource::make($user)->resolve(),
        ]);
    }
}
