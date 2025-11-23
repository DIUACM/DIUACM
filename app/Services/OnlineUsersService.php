<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class OnlineUsersService
{
    /**
     * Get the count of online users.
     */
    public function getOnlineCount(): int
    {
        return Cache::remember('online-count', now()->addSeconds(30), function () {
            $userCount = count($this->getOnlineUserIds());
            $guestCount = count($this->getOnlineGuestIds());

            return $userCount + $guestCount;
        });
    }

    /**
     * Get the IDs of online authenticated users.
     */
    protected function getOnlineUserIds(): array
    {
        $keys = Cache::get('online-user-ids', []);

        return array_filter($keys, function ($key) {
            return Cache::has($key);
        });
    }

    /**
     * Get the session IDs of online guests.
     */
    protected function getOnlineGuestIds(): array
    {
        $keys = Cache::get('online-guest-ids', []);

        return array_filter($keys, function ($key) {
            return Cache::has($key);
        });
    }

    /**
     * Track an online user.
     */
    public function trackUser(int $userId): void
    {
        $key = 'user-online-'.$userId;
        $expiresAt = now()->addMinutes(5);

        Cache::put($key, true, $expiresAt);

        $userIds = Cache::get('online-user-ids', []);
        if (! in_array($key, $userIds)) {
            $userIds[] = $key;
            Cache::put('online-user-ids', $userIds, now()->addDay());
            Cache::forget('online-count');
        }
    }

    /**
     * Track an online guest.
     */
    public function trackGuest(string $sessionId): void
    {
        $key = 'guest-online-'.$sessionId;
        $expiresAt = now()->addMinutes(5);

        Cache::put($key, true, $expiresAt);

        $guestIds = Cache::get('online-guest-ids', []);
        if (! in_array($key, $guestIds)) {
            $guestIds[] = $key;
            Cache::put('online-guest-ids', $guestIds, now()->addDay());
            Cache::forget('online-count');
        }
    }
}
