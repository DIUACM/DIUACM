<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Http\Resources\InternalContestDetailsResource;
use App\Http\Resources\InternalContestResource;
use App\Models\InternalContest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InternalContestController extends Controller
{
    /**
     * Display a paginated list of internal contests.
     */
    public function index(Request $request): Response
    {
        $contests = InternalContest::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->when($request->get('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('internal-contests/index', [
            'contests' => InternalContestResource::collection($contests),
            'filters' => [
                'search' => $request->get('search'),
            ],
        ]);
    }

    /**
     * Display the specified internal contest.
     */
    public function show(InternalContest $internalContest): Response
    {
        if ($internalContest->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        return Inertia::render('internal-contests/show', [
            'contest' => InternalContestDetailsResource::make($internalContest)->resolve(),
        ]);
    }
}
