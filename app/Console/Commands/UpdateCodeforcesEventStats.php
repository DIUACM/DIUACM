<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class UpdateCodeforcesEventStats extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:update-cf-contests
                            {--id= : Process a specific event by ID}
                            {--limit= : Limit the number of events to process}
                            {--fresh : Clear existing stats for matched events before updating}
                            {--delay=300 : Delay between Codeforces user.status API calls in milliseconds}';

    /**
     * The console command description.
     */
    protected $description = 'Update EventUserStat for Codeforces contests (solve, upsolve, and presence)';

    private const CODEFORCES_STANDINGS_URL = 'https://codeforces.com/api/contest.standings';

    private const CODEFORCES_USER_STATUS_URL = 'https://codeforces.com/api/user.status';

    private const USER_STATUS_PAGE_SIZE = 100;

    private const USER_STATUS_MAX_PAGES = 100;

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

        $events = $eventsQuery->get(['id', 'title', 'event_link', 'starting_at', 'ending_at']);

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

            // Get all users who have a Codeforces handle
            $users = User::query()
                ->whereNotNull('codeforces_handle')
                ->where('codeforces_handle', '!=', '')
                ->get(['id', 'name', 'codeforces_handle']);

            if ($users->isEmpty()) {
                $this->warn('  No users with Codeforces handles found.');

                continue;
            }

            $url = self::CODEFORCES_STANDINGS_URL;
            $query = ['contestId' => $contestId];
            $cacheKey = "codeforces_standings_{$contestId}_public_v2";

            try {
                $payload = Cache::remember($cacheKey, now()->addHours(2), function () use ($query, $url, $contestId) {
                    $response = Http::timeout(30)
                        ->acceptJson()
                        ->get($url, $query);

                    if (! $response->successful()) {
                        throw new \Exception("Failed to fetch standings from Codeforces API for contest {$contestId} (HTTP {$response->status()})");
                    }

                    $responseData = $response->json();
                    if (($responseData['status'] ?? null) !== 'OK') {
                        throw new \Exception("Codeforces API returned error for contest {$contestId}: ".($responseData['comment'] ?? 'unknown error'));
                    }

                    return $responseData;
                });

                $result = is_array($payload['result'] ?? null) ? $payload['result'] : [];
            } catch (\Exception $e) {
                $this->error("  {$e->getMessage()}");

                continue;
            }

            $rows = is_array($result['rows'] ?? null) ? $result['rows'] : [];
            $problemIndexes = $this->problemIndexes($result['problems'] ?? []);
            $contestRowsByHandle = $this->contestRowsByHandle(
                $rows,
                $users
                    ->map(fn (User $user): string => $this->normalizeHandle((string) $user->codeforces_handle))
                    ->filter()
                    ->values()
                    ->all()
            );
            [, $contestEndSeconds] = $this->contestWindow($result['contest'] ?? [], $event);

            unset($payload, $result, $rows);

            foreach ($users as $user) {
                $handle = trim((string) $user->codeforces_handle);
                $contestRow = $contestRowsByHandle[$this->normalizeHandle($handle)] ?? null;
                $solvedProblemIndexes = $this->solvedProblemIndexes(
                    is_array($contestRow) ? $contestRow : null,
                    $problemIndexes
                );
                $upsolvedProblemIndexes = ! empty($problemIndexes) && count($solvedProblemIndexes) >= count($problemIndexes)
                    ? []
                    : $this->upsolvedProblemIndexes(
                        $handle,
                        $contestId,
                        $contestEndSeconds,
                        $solvedProblemIndexes
                    );
                $upsolvesAvailable = $upsolvedProblemIndexes !== false;

                if (! $upsolvesAvailable) {
                    $this->warn("  [skip upsolves] Failed to fetch submissions for {$handle}");
                    $upsolvedProblemIndexes = [];
                }

                if (! is_array($contestRow) && (! $upsolvesAvailable || empty($upsolvedProblemIndexes))) {
                    continue;
                }

                $solve = count($solvedProblemIndexes);
                $upsolve = count($upsolvedProblemIndexes);
                $stats = [
                    'solve_count' => $solve,
                    'participation' => is_array($contestRow),
                ];

                if ($upsolvesAvailable) {
                    $stats['upsolve_count'] = $upsolve;
                }

                EventUserStat::updateOrCreate([
                    'event_id' => $event->id,
                    'user_id' => $user->id,
                ], $stats);

                $this->line(sprintf(
                    '  · %s — solved: %d, upsolved: %s, present: %s',
                    $user->name,
                    $solve,
                    $upsolvesAvailable ? (string) $upsolve : 'unknown',
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
     * @param  array<int, array<string, mixed>>|mixed  $problems
     * @return array<int, string>
     */
    private function problemIndexes(mixed $problems): array
    {
        if (! is_array($problems)) {
            return [];
        }

        $indexes = [];
        foreach ($problems as $position => $problem) {
            if (! is_array($problem)) {
                continue;
            }

            $indexes[(int) $position] = (string) ($problem['index'] ?? $position);
        }

        return $indexes;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, string>  $localHandles
     * @return array<string, array<string, mixed>>
     */
    private function contestRowsByHandle(array $rows, array $localHandles): array
    {
        $localHandleLookup = array_fill_keys($localHandles, true);
        $contestRows = [];

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $type = $row['party']['participantType'] ?? '';
            if (! in_array($type, ['CONTESTANT', 'OUT_OF_COMPETITION'], true)) {
                continue;
            }

            $members = $row['party']['members'] ?? [];
            if (! is_array($members)) {
                continue;
            }

            foreach ($members as $member) {
                if (! is_array($member)) {
                    continue;
                }

                $handle = $this->normalizeHandle((string) ($member['handle'] ?? ''));
                if ($handle === '' || ! isset($localHandleLookup[$handle]) || isset($contestRows[$handle])) {
                    continue;
                }

                $contestRows[$handle] = $row;
            }
        }

        return $contestRows;
    }

    /**
     * @param  array<string, mixed>  $contest
     * @return array{0:int,1:int}
     */
    private function contestWindow(array $contest, Event $event): array
    {
        $startSeconds = (int) ($contest['startTimeSeconds'] ?? $event->starting_at->timestamp);
        $durationSeconds = (int) ($contest['durationSeconds'] ?? max(0, $event->ending_at->timestamp - $startSeconds));

        return [$startSeconds, $startSeconds + $durationSeconds];
    }

    /**
     * @param  array<string, mixed>|null  $contestRow
     * @param  array<int, string>  $problemIndexes
     * @return array<string, true>
     */
    private function solvedProblemIndexes(?array $contestRow, array $problemIndexes): array
    {
        if (! is_array($contestRow)) {
            return [];
        }

        $solved = [];
        foreach (($contestRow['problemResults'] ?? []) as $position => $problemResult) {
            $points = is_array($problemResult) && array_key_exists('points', $problemResult)
                ? (float) $problemResult['points']
                : 0.0;

            if ($points <= 0) {
                continue;
            }

            $problemIndex = $problemIndexes[(int) $position] ?? (string) $position;
            $solved[$problemIndex] = true;
        }

        return $solved;
    }

    /**
     * @param  array<string, true>  $solvedProblemIndexes
     * @return array<string, true>|false
     */
    private function upsolvedProblemIndexes(string $handle, string $contestId, int $contestEndSeconds, array $solvedProblemIndexes): array|false
    {
        if ($handle === '') {
            return [];
        }

        $cacheKey = 'codeforces_user_status_'.md5($this->normalizeHandle($handle).'_'.$contestId.'_'.$contestEndSeconds);

        try {
            $upsolvedProblemIndexes = Cache::remember($cacheKey, now()->addHours(2), function () use ($handle, $contestId, $contestEndSeconds, $solvedProblemIndexes): array {
                $upsolved = [];
                $from = 1;

                for ($page = 0; $page < self::USER_STATUS_MAX_PAGES; $page++) {
                    $response = Http::timeout(30)
                        ->acceptJson()
                        ->get(self::CODEFORCES_USER_STATUS_URL, [
                            'handle' => $handle,
                            'from' => $from,
                            'count' => self::USER_STATUS_PAGE_SIZE,
                        ]);

                    $this->pauseAfterCodeforcesRequest();

                    if (! $response->successful()) {
                        throw new \Exception("Failed to fetch submissions for {$handle} (HTTP {$response->status()})");
                    }

                    $responseData = $response->json();
                    if (($responseData['status'] ?? null) !== 'OK') {
                        throw new \Exception("Codeforces API returned error for {$handle}: ".($responseData['comment'] ?? 'unknown error'));
                    }

                    $submissions = is_array($responseData['result'] ?? null) ? $responseData['result'] : [];
                    if (empty($submissions)) {
                        break;
                    }

                    $oldestSubmissionTime = null;
                    foreach ($submissions as $submission) {
                        if (! is_array($submission)) {
                            continue;
                        }

                        $createdAt = (int) ($submission['creationTimeSeconds'] ?? 0);
                        $oldestSubmissionTime = $createdAt;

                        if ($createdAt <= $contestEndSeconds || ($submission['verdict'] ?? '') !== 'OK') {
                            continue;
                        }

                        $problemContestId = (string) ($submission['problem']['contestId'] ?? $submission['contestId'] ?? '');
                        $problemIndex = (string) ($submission['problem']['index'] ?? '');

                        if ($problemContestId !== $contestId || $problemIndex === '' || isset($solvedProblemIndexes[$problemIndex])) {
                            continue;
                        }

                        $upsolved[$problemIndex] = true;
                    }

                    if (count($submissions) < self::USER_STATUS_PAGE_SIZE || ($oldestSubmissionTime !== null && $oldestSubmissionTime <= $contestEndSeconds)) {
                        break;
                    }

                    $from += self::USER_STATUS_PAGE_SIZE;
                }

                return $upsolved;
            });

            return is_array($upsolvedProblemIndexes) ? $upsolvedProblemIndexes : false;
        } catch (\Exception) {
            return false;
        }
    }

    private function pauseAfterCodeforcesRequest(): void
    {
        $delay = (int) $this->option('delay');

        if ($delay > 0) {
            usleep($delay * 1000);
        }
    }

    private function normalizeHandle(string $handle): string
    {
        return strtolower(trim($handle));
    }
}
