<?php

namespace App\Http\Controllers;

use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'category' => ['nullable', 'in:contest,class,other'],
            'scope' => ['nullable', 'in:open_for_all,only_girls,junior_programmers,selected_persons'],
            'title' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = 10;

        $query = Event::query()
            ->where('status', VisibilityStatus::PUBLISHED)
            ->when($validated['category'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->when($validated['scope'] ?? null, fn ($q, $scope) => $q->where('participation_scope', $scope))
            ->when($validated['title'] ?? null, function ($q, $title) {
                $q->where('title', 'like', "%{$title}%");
            })
            ->withCount('attendees')
            ->orderByDesc('starting_at');

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('events/index', [
            'events' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'limit' => $paginator->perPage(),
            ],
            'filters' => [
                'category' => $validated['category'] ?? null,
                'scope' => $validated['scope'] ?? null,
                'title' => $validated['title'] ?? null,
            ],
            'scopes' => collect(ParticipationScope::cases())->map(fn ($c) => [
                'id' => $c->value,
                'name' => $c->getLabel(),
            ])->values(),
        ]);
    }
}
