<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class UpdateAtcoderEventStats extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:update-atcoder-event-stats
                            {--id= : Process a specific event by ID}
                            {--limit= : Limit the number of events to process}
                            {--fresh : Clear existing stats for matched events before updating}';

    /**
     * The console command description.
     */
    protected $description = 'Update EventUserStat for AtCoder contests (solve, upsolve, and presence)';

    /**
     * cURL handle instance.
     */
    private ?\CurlHandle $curl = null;

    private const ATCODER_API_CONTESTS = 'https://kenkoooo.com/atcoder/resources/contests.json';

    private const ATCODER_API_SUBMISSIONS = 'https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions';

    public function __construct()
    {
        parent::__construct();

        $handle = curl_init();
        if ($handle !== false) {
            $this->curl = $handle;
            curl_setopt_array($this->curl, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
            ]);
        }
    }

    public function __destruct()
    {
        if ($this->curl instanceof \CurlHandle) {
            curl_close($this->curl);
        }
    }

    public function handle(): int
    {
        $eventsQuery = Event::query()
            ->where('event_link', 'like', '%atcoder.jp%')
            ->whereHas('rankLists', function ($q): void {
                $q->where('is_active', true);
            });

        if ($this->option('id')) {
            $eventsQuery->whereKey($this->option('id'));
        }

        $events = $eventsQuery->get(['id', 'title', 'event_link', 'starting_at']);

        if ($limit = $this->option('limit')) {
            if (is_numeric($limit)) {
                $events = $events->take((int) $limit);
            }
        }

        if ($events->isEmpty()) {
            $this->info('No AtCoder events found to process.');

            return self::SUCCESS;
        }

        if ($this->option('fresh')) {
            $eventIds = $events->pluck('id');
            EventUserStat::whereIn('event_id', $eventIds)->delete();
            $this->info('Cleared existing stats for matched events.');
        }

        $contestsJson = Cache::remember('atcoder_contests_json', 60 * 60 * 2, function (): string|false {
            return $this->fetch(self::ATCODER_API_CONTESTS);
        });

        if (! $contestsJson) {
            $this->error('Failed to fetch AtCoder contests list. Aborting.');

            return self::FAILURE;
        }

        /** @var array<int, array{id:string,start_epoch_second:int,duration_second:int}> $contests */
        $contests = json_decode($contestsJson, true) ?? [];

        // Prepare contest data for processing
        $contestData = [];
        foreach ($events as $event) {
            $contestId = $this->extractContestId($event->event_link);
            if ($contestId === null) {
                $this->warn("[skip] Invalid AtCoder contest URL for event #{$event->id} {$event->title}");

                continue;
            }

            $contest = collect($contests)->firstWhere('id', $contestId);
            if (! $contest) {
                $this->warn("[skip] Contest ID {$contestId} not found in AtCoder contests list for event #{$event->id}");

                continue;
            }

            $contestData[$contestId] = [
                'event' => $event,
                'start_epoch' => (int) $contest['start_epoch_second'],
                'duration' => (int) $contest['duration_second'],
            ];
        }

        if (empty($contestData)) {
            $this->info('No valid AtCoder contests to process.');

            return self::SUCCESS;
        }

        // Get all unique users across all events
        $eventIds = collect($contestData)->pluck('event.id');
        $users = User::query()
            ->whereHas('rankLists', function ($q) use ($eventIds): void {
                $q->whereHas('events', function ($qq) use ($eventIds): void {
                    $qq->whereIn('events.id', $eventIds);
                });
            })
            ->get(['id', 'name', 'atcoder_handle'])
            ->unique('id');

        if ($users->isEmpty()) {
            $this->warn('No users found across all events.');

            return self::SUCCESS;
        }

        $this->line("Processing {$users->count()} users across ".count($contestData).' contests...');

        // Process each user once and calculate stats for all their relevant events
        foreach ($users as $user) {
            $this->processUserForAllEvents($user, $contestData);
        }

        $this->info('Done.');

        return self::SUCCESS;
    }

    private function processUserForAllEvents(User $user, array $contestData): void
    {
        $handle = trim((string) $user->atcoder_handle);

        // If user has no handle, mark as absent for all relevant events
        if ($handle === '') {
            foreach ($contestData as $contestId => $data) {
                $event = $data['event'];

                // Check if user is associated with this specific event
                $isUserAssociated = User::query()
                    ->where('id', $user->id)
                    ->whereHas('rankLists', function ($q) use ($event): void {
                        $q->whereHas('events', function ($qq) use ($event): void {
                            $qq->where('events.id', $event->id);
                        });
                    })
                    ->exists();

                if ($isUserAssociated) {
                    EventUserStat::updateOrCreate([
                        'event_id' => $event->id,
                        'user_id' => $user->id,
                    ], [
                        'solve_count' => 0,
                        'upsolve_count' => 0,
                        'participation' => false,
                    ]);
                    $this->line("  · {$user->name} — no AtCoder handle, set absent for {$event->title}");
                }
            }

            return;
        }

        // Fetch all submissions for this user
        $allSubmissions = $this->fetchAllUserSubmissions($handle);
        if ($allSubmissions === false) {
            $this->error("  [skip] Failed to fetch submissions for user '{$handle}'");

            return;
        }

        // Group submissions by contest_id for efficient processing
        $submissionsByContest = [];
        foreach ($allSubmissions as $submission) {
            $contestId = $submission['contest_id'] ?? '';
            if ($contestId !== '') {
                $submissionsByContest[$contestId][] = $submission;
            }
        }

        // Process each contest this user participated in
        foreach ($contestData as $contestId => $data) {
            $event = $data['event'];
            $startEpoch = $data['start_epoch'];
            $endEpoch = $startEpoch + $data['duration'];

            // Check if user is associated with this specific event
            $isUserAssociated = User::query()
                ->where('id', $user->id)
                ->whereHas('rankLists', function ($q) use ($event): void {
                    $q->whereHas('events', function ($qq) use ($event): void {
                        $qq->where('events.id', $event->id);
                    });
                })
                ->exists();

            if (! $isUserAssociated) {
                continue;
            }

            $contestSubmissions = $submissionsByContest[$contestId] ?? [];

            $solved = [];
            $upsolved = [];
            $present = false;

            foreach ($contestSubmissions as $submission) {
                $t = (int) ($submission['epoch_second'] ?? 0);
                $pid = (string) ($submission['problem_id'] ?? '');
                $res = (string) ($submission['result'] ?? '');

                $inWindow = $t >= $startEpoch && $t <= $endEpoch;

                if ($inWindow) {
                    $present = true; // any attempt during contest window counts as presence
                }

                if ($res === 'AC') {
                    if ($inWindow) {
                        $solved[$pid] = true;
                    } elseif ($t > $endEpoch && ! isset($solved[$pid])) {
                        $upsolved[$pid] = true;
                    }
                }
            }

            EventUserStat::updateOrCreate([
                'event_id' => $event->id,
                'user_id' => $user->id,
            ], [
                'solve_count' => count($solved),
                'upsolve_count' => count($upsolved),
                'participation' => $present,
            ]);

            $this->line(sprintf(
                '  · %s [%s] — solved: %d, upsolved: %d, present: %s',
                $user->name,
                $event->title,
                count($solved),
                count($upsolved),
                $present ? 'yes' : 'no'
            ));
        }
    }

    /**
     * Fetch all submissions for a user with pagination support.
     *
     * @return array<int, array{contest_id:string,epoch_second:int,problem_id:string,result:string}>|false
     */
    private function fetchAllUserSubmissions(string $handle): array|false
    {
        $allSubmissions = [];
        $fromSecond = 0;
        $maxPages = 1000; // Safety limit to prevent infinite loops
        $currentPage = 0;

        do {
            $url = self::ATCODER_API_SUBMISSIONS.'?user='.rawurlencode($handle).'&from_second='.$fromSecond;
            $subsJson = $this->fetch($url);

            if ($subsJson === false) {
                return false;
            }

            /** @var array<int, array{contest_id:string,epoch_second:int,problem_id:string,result:string}> $submissions */
            $submissions = json_decode($subsJson, true) ?? [];

            if (empty($submissions)) {
                break;
            }

            $allSubmissions = array_merge($allSubmissions, $submissions);

            // If we got fewer than 500 submissions, we've reached the end
            if (count($submissions) < 500) {
                break;
            }

            // Set the next fromSecond to the last submission's epoch_second
            $lastSubmission = end($submissions);
            $fromSecond = (int) ($lastSubmission['epoch_second'] ?? 0);

            $currentPage++;

            // Safety check to prevent infinite loops
            if ($currentPage >= $maxPages) {
                $this->warn("  Reached maximum page limit ({$maxPages}) for user {$handle}");
                break;
            }

        } while (true);

        return $allSubmissions;
    }

    private function extractContestId(?string $eventLink): ?string
    {
        if (! $eventLink) {
            return null;
        }

        $parsed = parse_url($eventLink);
        $path = trim($parsed['path'] ?? '', '/');
        $parts = $path !== '' ? explode('/', $path) : [];

        if ((count($parts) >= 2) && $parts[0] === 'contests' && $parts[1] !== '') {
            return $parts[1];
        }

        return null;
    }

    /**
     * Fetch URL with cURL; returns string on success, false on failure.
     */
    private function fetch(string $url): string|false
    {
        if (! ($this->curl instanceof \CurlHandle)) {
            return false;
        }

        curl_setopt($this->curl, CURLOPT_URL, $url);
        $resp = curl_exec($this->curl);
        if ($resp === false) {
            return false;
        }

        return $resp;
    }
}
