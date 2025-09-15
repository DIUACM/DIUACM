<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Models\Tracker;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

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
     public function show(Request $request, string $slug, ?string $keyword = null)
    {
        $tracker = Tracker::where('slug', $slug)
            ->where('status', VisibilityStatus::PUBLISHED)
            ->with(['rankLists:id,tracker_id,keyword'])
            ->select('id','title')
            ->firstOrFail();

        $selectedRankList = null;
        if ($keyword) {
            $selectedRankList = $tracker->rankLists->firstWhere('keyword', $keyword);
        }
        if (! $selectedRankList) {
            $selectedRankList = $tracker->rankLists->first();
        }

        $selectedRankList->loadMissing([
            'events' => function ($query) {
            $query->where('status', VisibilityStatus::PUBLISHED)
                  ->select('events.id', 'events.title');
            }
            ,'users'=> function ($query) {
                $query->select('users.id', 'users.name', 'users.username','users.image_url');
            },
        ]);
        


        dump($selectedRankList->toArray());
    }
}
