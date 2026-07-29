<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MigrationExportController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'users' => $this->userRows(),
                'events' => $this->tableRows('events'),
                'trackers' => $this->tableRows('trackers'),
                'rank_lists' => $this->tableRows('rank_lists'),
                'event_attendance' => $this->tableRows('event_attendance'),
                'event_rank_list' => $this->tableRows('event_rank_list', ['event_id', 'rank_list_id']),
                'event_user_stats' => $this->tableRows('event_user_stats'),
                'rank_list_user' => $this->tableRows('rank_list_user', ['rank_list_id', 'user_id']),
            ],
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function userRows(): Collection
    {
        return User::query()
            ->with('media')
            ->orderBy('id')
            ->get()
            ->map(fn (User $user): array => [
                ...$user->getAttributes(),
                'image' => $user->avatar_url,
            ]);
    }

    /**
     * @param  list<string>  $orderBy
     * @return Collection<int, object>
     */
    private function tableRows(string $table, array $orderBy = ['id']): Collection
    {
        $query = DB::table($table);

        foreach ($orderBy as $column) {
            $query->orderBy($column);
        }

        return $query->get();
    }
}
