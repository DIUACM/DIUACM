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
        $programmers = User::query()
            ->select('id', 'name', 'username', 'student_id', 'department', 'codeforces_handle', 'atcoder_handle', 'vjudge_handle', 'max_cf_rating')
            ->with(['media' => fn ($query) => $query->where('collection_name', 'profile_picture')->limit(1)])
            ->search(request('search'))
            ->orderByDesc('max_cf_rating')
            ->orderBy('name')
            ->paginate(15);

        return ProgrammerResource::collection($programmers);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $programmer)
    {
        $programmer->load(['media' => fn ($query) => $query->where('collection_name', 'profile_picture')->limit(1)]);

        $programmer->load(['teams:id,name,contest_id,rank,solve_count', 'teams.contest:id,name,date', 'teams.members', 'teams.members.media']);

        return new ProgrammerResource($programmer);
    }
}
