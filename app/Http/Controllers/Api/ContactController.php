<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $data = $request->validated();

        $message = ContactMessage::create($data);

        return response()->json([
            'message' => 'Your message has been received.',
            'data' => [
                'id' => $message->id,
                'name' => $message->name,
                'email' => $message->email,
                'created_at' => $message->created_at?->toISOString(),
            ],
        ], 201);
    }
}
