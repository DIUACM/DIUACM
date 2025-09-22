<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
            ->paginate(12) // 12 items per page (4 rows × 3 items)
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

        return Inertia::render('programmers/index', [
            'programmers' => $programmers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
