<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncentiveApplicationRequest;
use App\Models\IncentiveApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IncentiveApplicationController extends Controller
{
    /**
     * Display the incentive application form or existing application.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Check if user already has an application
        $existingApplication = IncentiveApplication::where('user_id', $user->id)->first();

        return Inertia::render('incentive-application/index', [
            'existingApplication' => $existingApplication,
        ]);
    }

    /**
     * Store a newly created incentive application.
     */
    public function store(StoreIncentiveApplicationRequest $request)
    {
        $validated = $request->validated();

        // Check if user already has an application
        $existingApplication = IncentiveApplication::where('user_id', $request->user()->id)->first();

        if ($existingApplication) {
            // Update existing application
            $existingApplication->update([
                'full_name' => $validated['full_name'],
                'student_id' => $validated['student_id'],
                'batch' => $validated['batch'],
                'email' => $request->user()->email,
                'current_semester' => $validated['current_semester'],
                'phone_number' => $validated['phone_number'],
                'courses' => $validated['courses'],
            ]);
        } else {
            // Create new application
            IncentiveApplication::create([
                'user_id' => $request->user()->id,
                'full_name' => $validated['full_name'],
                'student_id' => $validated['student_id'],
                'batch' => $validated['batch'],
                'email' => $request->user()->email,
                'current_semester' => $validated['current_semester'],
                'phone_number' => $validated['phone_number'],
                'courses' => $validated['courses'],
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Application submitted successfully!',
        ]);

        return redirect()->route('incentive-application.index');
    }
}
