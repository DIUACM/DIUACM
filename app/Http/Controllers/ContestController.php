<?php

namespace App\Http\Controllers;

use App\Http\Resources\ContestDetailsResource;
use App\Http\Resources\ContestResource;
use App\Models\Contest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContestController extends Controller
{
    /**
     * Display a paginated list of contests.
     */
    public function index(Request $request): Response
    {
        $contests = Contest::query()
            ->withCount('teams')
            ->when($request->get('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->get('contest_type'), function ($query, $type) {
                $query->where('contest_type', $type);
            })
            ->orderBy('date', 'desc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('contests/index', [
            'contests' => ContestResource::collection($contests),
            'filters' => [
                'search' => $request->get('search'),
                'contest_type' => $request->get('contest_type'),
            ],
        ]);
    }

    /**
     * Display the specified contest.
     */
    public function show(Contest $contest): Response
    {
        $contest->load([
            'gallery.media',
            'teams' => fn ($query) => $query
                ->with(['members:id,name,username,student_id'])
                ->orderBy('rank')
                ->orderByDesc('solve_count'),
        ]);

        return Inertia::render('contests/show', [
            'contest' => ContestDetailsResource::make($contest)->resolve(),
        ]);
    }
}
