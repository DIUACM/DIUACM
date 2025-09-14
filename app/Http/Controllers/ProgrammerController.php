<?php

namespace App\Http\Controllers;

use App\Models\Programmer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgrammerController extends Controller
{
    /**
     * Display a listing of programmers.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'skills' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'available_for_hire' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = 12;

        $query = Programmer::query()
            ->when($validated['search'] ?? null, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('bio', 'like', "%{$search}%")
                        ->orWhere('codeforces_handle', 'like', "%{$search}%")
                        ->orWhere('atcoder_handle', 'like', "%{$search}%");
                });
            })
            ->when($validated['skills'] ?? null, function ($q, $skills) {
                $skillArray = array_map('trim', explode(',', $skills));
                foreach ($skillArray as $skill) {
                    $q->whereJsonContains('skills', $skill);
                }
            })
            ->when($validated['location'] ?? null, function ($q, $location) {
                $q->where('location', 'like', "%{$location}%");
            })
            ->when(isset($validated['available_for_hire']), function ($q, $available) {
                $q->where('is_available_for_hire', $available);
            })
            ->orderByDesc('created_at');

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('programmers/index', [
            'programmers' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'pages' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'limit' => $paginator->perPage(),
            ],
            'filters' => [
                'search' => $validated['search'] ?? null,
                'skills' => $validated['skills'] ?? null,
                'location' => $validated['location'] ?? null,
                'available_for_hire' => $validated['available_for_hire'] ?? null,
            ],
        ]);
    }

    /**
     * Display the specified programmer.
     */
    public function show(Programmer $programmer): Response
    {
        $programmer->load(['attendedEvents', 'rankLists', 'eventUserStats']);

        return Inertia::render('programmers/show', [
            'programmer' => $programmer,
        ]);
    }
}