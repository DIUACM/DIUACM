<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgrammerResource;
use App\Models\User;

class ProgrammerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = User::query()
            ->select('id', 'name', 'username', 'student_id', 'department', 'max_cf_rating')
            ->with(['media' => fn ($query) => $query->where('collection_name', 'profile_picture')->limit(1)]);

        // Search functionality
        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('codeforces_handle', 'like', "%{$search}%")
                    ->orWhere('atcoder_handle', 'like', "%{$search}%")
                    ->orWhere('vjudge_handle', 'like', "%{$search}%");
            });
        }

        // Order by max CF rating (desc) and then by name
        $programmers = $query->orderByDesc('max_cf_rating')
            ->orderBy('name')
            ->paginate(15);

        return ProgrammerResource::collection($programmers);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $programmer)
    {
        $programmer->load(['media' => fn ($query) => $query->where('collection_name', 'profile_picture')]);

        return new ProgrammerResource($programmer);
    }
}
