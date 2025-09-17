<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContestResource;
use App\Models\Contest;

class ContestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contests = Contest::select('id', 'name', 'contest_type', 'location', 'date')
            ->orderBy('date', 'desc')
            ->paginate(10);

        return ContestResource::collection($contests);
    }

    /**
     * Display the specified resource.
     */
    public function show(Contest $contest)
    {
        $contest->load([
            'gallery:id,title,slug',
            'teams:id,name,contest_id,rank,solve_count',
            'teams.members:id,name,username,student_id,department',
        ]);

        return new ContestResource($contest);
    }
}
