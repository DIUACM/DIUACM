<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventUserStat;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
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
    protected $description = 'Update EventUserStat for AtCoder contests (solves, upsolves, and presence)';

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

            $this->line("Processing event #{$event->id} — {$event->title} ({$contestId})");

            // All users associated with the event through any of its ranklists.
            $users = User::query()
                ->whereHas('rankLists', function ($q) use ($event): void {
                    $q->whereHas('events', function ($qq) use ($event): void {
                        $qq->where('events.id', $event->id);
                    });
                })
                ->get(['id', 'name', 'atcoder_handle']);

            if ($users->isEmpty()) {
                $this->warn('  No users associated via ranklists.');

                continue;
            }

            $this->processUsersForEvent($users, $event->id, $contestId, (int) $contest['start_epoch_second'], (int) $contest['duration_second']);
        }

        $this->info('Done.');

        return self::SUCCESS;
    }

    private function processUsersForEvent(Collection $users, int $eventId, string $contestId, int $startEpoch, int $duration): void
    {
        $endEpoch = $startEpoch + $duration;

        // Partition users by presence of a non-empty handle
        $withHandles = $users->filter(function ($u) {
            $h = $u->atcoder_handle;

            return $h !== null && trim((string) $h) !== '';
        })->values();
        $withoutHandles = $users->reject(function ($u) {
            $h = $u->atcoder_handle;

            return $h !== null && trim((string) $h) !== '';
        })->values();

        // Mark users without handles as absent with zeros
        /** @var \App\Models\User $user */
        foreach ($withoutHandles as $user) {
            EventUserStat::updateOrCreate([
                'event_id' => $eventId,
                'user_id' => $user->id,
            ], [
                'solves_count' => 0,
                'upsolves_count' => 0,
                'participation' => false,
            ]);
            $this->line("  · {$user->name} — no AtCoder handle, set absent");
        }

        // Process users with handles
        /** @var \App\Models\User $user */
        foreach ($withHandles as $user) {
            $handle = trim((string) $user->atcoder_handle);

            // Fetch user submissions from the start time; API returns all later submissions.
            $subsJson = $this->fetch(self::ATCODER_API_SUBMISSIONS.'?user='.rawurlencode($handle).'&from_second='.$startEpoch);
            if ($subsJson === false) {
                EventUserStat::updateOrCreate([
                    'event_id' => $eventId,
                    'user_id' => $user->id,
                ], [
                    'solves_count' => 0,
                    'upsolves_count' => 0,
                    'participation' => false,
                ]);
                $this->line("  · {$user->name} — API error, set absent");

                continue;
            }

            /** @var array<int, array{contest_id:string,epoch_second:int,problem_id:string,result:string}> $subs */
            $subs = json_decode($subsJson, true) ?? [];

            $solved = [];
            $upsolved = [];
            $present = false;

            foreach ($subs as $s) {
                if (($s['contest_id'] ?? null) !== $contestId) {
                    continue;
                }

                $t = (int) ($s['epoch_second'] ?? 0);
                $pid = (string) ($s['problem_id'] ?? '');
                $res = (string) ($s['result'] ?? '');

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
                'event_id' => $eventId,
                'user_id' => $user->id,
            ], [
                'solves_count' => count($solved),
                'upsolves_count' => count($upsolved),
                'participation' => $present,
            ]);

            $this->line(sprintf(
                '  · %s — solved: %d, upsolved: %d, present: %s',
                $user->name,
                count($solved),
                count($upsolved),
                $present ? 'yes' : 'no'
            ));
        }
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
