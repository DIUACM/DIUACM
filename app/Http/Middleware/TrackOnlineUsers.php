<?php

namespace App\Http\Middleware;

use App\Services\OnlineUsersService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackOnlineUsers
{
    public function __construct(protected OnlineUsersService $onlineUsersService) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $this->onlineUsersService->trackUser($request->user()->id);
        } else {
            $this->onlineUsersService->trackGuest(session()->getId());
        }

        return $next($request);
    }
}
