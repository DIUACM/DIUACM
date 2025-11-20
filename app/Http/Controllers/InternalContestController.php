<?php

namespace App\Http\Controllers;

use App\Enums\VisibilityStatus;
use App\Http\Resources\InternalContestDetailsResource;
use App\Http\Resources\InternalContestMyRegistrationResource;
use App\Http\Resources\InternalContestRegistrationViewResource;
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

    /**
     * Show the registration page for the internal contest.
     */
    public function registration(InternalContest $internalContest)
    {
        if ($internalContest->status !== VisibilityStatus::PUBLISHED) {
            abort(404);
        }

        if ($internalContest->registrations()->where('user_id', request()->user()->id)->exists()) {
            return redirect()->route('internal-contests.my-registration', $internalContest);
        }

        if (!$internalContest->isRegistrationOpen()) {
            return Inertia::render('internal-contests/show', [
                'contest' => InternalContestDetailsResource::make($internalContest)->resolve(),
                'flash' => [
                    'error' => 'Registration is closed for this contest.',
                ],
            ]);
        }

        return Inertia::render('internal-contests/register', [
            'contest' => InternalContestRegistrationViewResource::make($internalContest)->resolve(),
        ]);
    }

    /**
     * Store a newly created registration in storage.
     */
    public function storeRegistration(Request $request, InternalContest $internalContest)
    {
        if ($internalContest->status !== VisibilityStatus::PUBLISHED || !$internalContest->isRegistrationOpen()) {
            abort(403, 'Registration is closed.');
        }

        if ($internalContest->registrations()->where('user_id', $request->user()->id)->exists()) {
            return redirect()->route('internal-contests.my-registration', $internalContest);
        }

        if ($internalContest->registrations()->where('student_id', $request->input('student_id'))->exists()) {
             return redirect()->back()->withErrors(['student_id' => 'This Student ID is already registered.']);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'section' => ['required', 'string', 'max:255'],
            'lab_teacher_name' => ['nullable', 'string', 'max:255'],
            'tshirt_size' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'string', 'in:male,female'],
            'transport_service_required' => ['boolean'],
            'pickup_point' => ['nullable', 'string', 'max:255', 'required_if:transport_service_required,true'],
        ]);

        $registration = $internalContest->registrations()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'student_id' => $validated['student_id'],
            'phone' => $validated['phone'],
            'department' => $validated['department'],
            'section' => $validated['section'],
            'lab_teacher_name' => $validated['lab_teacher_name'],
            'tshirt_size' => $validated['tshirt_size'],
            'gender' => $validated['gender'],
            'transport_service_required' => $validated['transport_service_required'],
            'pickup_point' => $validated['pickup_point'],
            'payment_status' => \App\Enums\PaymentStatus::PENDING,
        ]);

        // If fee is 0, mark as paid? Or handle payment logic.
        if ($internalContest->registration_fee <= 0) {
            $registration->update(['payment_status' => \App\Enums\PaymentStatus::PAID]);
        }

        return redirect()->route('internal-contests.my-registration', $internalContest)
            ->with('success', 'Registration successful!');
    }

    /**
     * Validate the student ID for the internal contest registration.
     */
    public function validateStudentId(Request $request, InternalContest $internalContest)
    {
        $request->validate([
            'student_id' => ['required', 'string'],
        ]);

        $studentId = $request->input('student_id');

        // Check if already registered
        $exists = $internalContest->registrations()
            ->where('student_id', $studentId)
            ->exists();

        if ($exists) {
            return response()->json([
                'valid' => false,
                'message' => 'This Student ID is already registered for this contest.',
            ]);
        }

        // Check regex if defined
        if ($internalContest->student_id_rules) {
            $pattern = $internalContest->student_id_rules;
            // Remove 'regex:' prefix if present, as we are using preg_match directly or we can use Validator
            if (str_starts_with($pattern, 'regex:')) {
                $pattern = substr($pattern, 6);
            }
            
            // Ensure pattern has delimiters
            if (!str_starts_with($pattern, '/')) {
                $pattern = '/' . $pattern . '/';
            }

            if (!preg_match($pattern, $studentId)) {
                 return response()->json([
                    'valid' => false,
                    'message' => 'Student ID format is invalid. ' . ($internalContest->student_id_rules_guide ?? ''),
                ]);
            }
        }

        return response()->json([
            'valid' => true,
            'message' => 'Student ID is available.',
        ]);
    }

    /**
     * Show the user's registration for the internal contest.
     */
    public function myRegistration(Request $request, InternalContest $internalContest): Response
    {
        $registration = $internalContest->registrations()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return Inertia::render('internal-contests/my-registration', [
            'registration' => InternalContestMyRegistrationResource::make($registration)->resolve(),
        ]);
    }
}
