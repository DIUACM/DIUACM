<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class UpdateCodeforcesEventStats extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:update-cf-contests
                            {--id= : Process a specific event by ID}
                            {--limit= : Limit the number of events to process}
                            {--fresh : Clear existing stats for matched events before updating}';

    /**
     * The console command description.
     */
    protected $description = 'Update EventUserStat for Codeforces contests (solves, upsolves, and presence)';

    public function handle(): int
    {
        $eventsQuery = Event::query()
            ->where('event_link', 'like', '%codeforces.com%')
            ->whereHas('rankLists', function ($q): void {
                $q->where('is_active', true);
            });

        if ($this->option('id')) {
            $eventsQuery->whereKey($this->option('id'));
        }

        $events = $eventsQuery->get(['id', 'title', 'event_link']);

        if ($limit = $this->option('limit')) {
            if (is_numeric($limit)) {
                $events = $events->take((int) $limit);
            }
        }

        if ($events->isEmpty()) {
            $this->info('No Codeforces events found to process.');

            return self::SUCCESS;
        }

        if ($this->option('fresh')) {
            $eventIds = $events->pluck('id');
            EventUserStat::whereIn('event_id', $eventIds)->delete();
            $this->info('Cleared existing stats for matched events.');
        }

        foreach ($events as $event) {
            $contestId = $this->extractContestId($event->event_link);
            if ($contestId === null) {
                $this->warn("[skip] Invalid Codeforces contest URL for event #{$event->id} {$event->title}");

                continue;
            }

            $this->line("Processing event #{$event->id} — {$event->title} (contest {$contestId})");

            // Get all users associated via ranklists
            $users = User::query()
                ->whereHas('rankLists', function ($q) use ($event): void {
                    $q->whereHas('events', function ($qq) use ($event): void {
                        $qq->where('events.id', $event->id);
                    });
                })
                ->get(['id', 'name', 'codeforces_handle']);

            if ($users->isEmpty()) {
                $this->warn('  No users associated via ranklists.');

                continue;
            }

            // Partition users based on presence of a handle
            $withHandles = $users->filter(function ($u) {
                $h = $u->codeforces_handle;

                return $h !== null && trim((string) $h) !== '';
            });
            $withoutHandles = $users->reject(function ($u) {
                $h = $u->codeforces_handle;

                return $h !== null && trim((string) $h) !== '';
            });

            // Users without a handle are marked absent with zero stats
            foreach ($withoutHandles as $user) {
                EventUserStat::updateOrCreate([
                    'event_id' => $event->id,
                    'user_id' => $user->id,
                ], [
                    'solves_count' => 0,
                    'upsolves_count' => 0,
                    'participation' => false,
                ]);
                $this->line("  · {$user->name} — no Codeforces handle, set absent");
            }

            if ($withHandles->isEmpty()) {
                continue;
            }

            // Fetch standings for valid handles
            $handles = $withHandles->pluck('codeforces_handle')->implode(';');
            $url = 'https://codeforces.com/api/contest.standings?contestId='.urlencode((string) $contestId).'&showUnofficial=true&handles='.urlencode($handles);

            $response = Http::timeout(30)
                ->acceptJson()
                ->get($url);

            if (! $response->successful()) {
                $this->error("  [skip] Failed to fetch standings from Codeforces API for contest {$contestId} (HTTP {$response->status()})");

                continue;
            }

            $payload = $response->json();
            if (($payload['status'] ?? null) !== 'OK') {
                $this->error("  [skip] Codeforces API returned error for contest {$contestId}: ".($payload['comment'] ?? 'unknown error'));

                continue;
            }

            $rows = collect($payload['result']['rows'] ?? []);

            foreach ($withHandles as $user) {
                // Find the contest row (participation) and practice row (upsolves)
                $contestRow = $rows->first(function ($row) use ($user) {
                    $handle = strtolower($row['party']['members'][0]['handle'] ?? '');
                    $type = $row['party']['participantType'] ?? '';

                    return $handle === strtolower((string) $user->codeforces_handle) && in_array($type, ['CONTESTANT', 'OUT_OF_COMPETITION'], true);
                });

                $practiceRow = $rows->first(function ($row) use ($user) {
                    $handle = strtolower($row['party']['members'][0]['handle'] ?? '');
                    $type = $row['party']['participantType'] ?? '';

                    return $handle === strtolower((string) $user->codeforces_handle)
                        && $type === 'PRACTICE';
                });

                // Calculate stats similar to the TS reference: points > 0 counts as solved; upsolves exclude problems solved in contest
                [$solves, $upsolves] = $this->calculateUserStats(
                    is_array($contestRow) ? $contestRow : null,
                    is_array($practiceRow) ? $practiceRow : null,
                );

                EventUserStat::updateOrCreate([
                    'event_id' => $event->id,
                    'user_id' => $user->id,
                ], [
                    'solves_count' => $solves,
                    'upsolves_count' => $upsolves,
                    'participation' => is_array($contestRow),
                ]);

                $this->line(sprintf(
                    '  · %s — solved: %d, upsolved: %d, present: %s',
                    $user->name,
                    $solves,
                    $upsolves,
                    is_array($contestRow) ? 'yes' : 'no'
                ));
            }
        }

        $this->info('Done.');

        return self::SUCCESS;
    }

    private function extractContestId(?string $eventLink): ?string
    {
        if (! $eventLink) {
            return null;
        }

        if (preg_match('/contests?\/(\d+)/', $eventLink, $m) === 1) {
            return $m[1];
        }

        return null;
    }

    /**
     * Calculate contest solves and upsolves from Codeforces rows.
     * Mirrors the TS calculateUserStats implementation:
     * - A problem counts as solved if points > 0.
     * - Upsolves are PRACTICE solves excluding problems solved during the contest.
     *
     * @param  array<string,mixed>|null  $contestRow
     * @param  array<string,mixed>|null  $practiceRow
     * @return array{0:int,1:int}
     */
    private function calculateUserStats(?array $contestRow, ?array $practiceRow): array
    {
        $solveCount = 0;
        $contestSolvedIdx = [];

        if (is_array($contestRow)) {
            foreach (($contestRow['problemResults'] ?? []) as $idx => $pr) {
                $points = is_array($pr) && array_key_exists('points', $pr) ? (float) $pr['points'] : 0.0;
                if ($points > 0) {
                    $solveCount++;
                    $contestSolvedIdx[] = (int) $idx;
                }
            }
        }

        $upsolveCount = 0;
        if (is_array($practiceRow)) {
            foreach (($practiceRow['problemResults'] ?? []) as $idx => $pr) {
                $points = is_array($pr) && array_key_exists('points', $pr) ? (float) $pr['points'] : 0.0;
                if ($points > 0 && ! in_array((int) $idx, $contestSolvedIdx, true)) {
                    $upsolveCount++;
                }
            }
        }

        return [$solveCount, $upsolveCount];
    }
}
