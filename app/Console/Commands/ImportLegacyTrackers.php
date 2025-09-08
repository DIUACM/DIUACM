<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\RankList;
use App\Models\Tracker;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ImportLegacyTrackers extends Command
{
    protected $signature = 'app:import-legacy-trackers {--url=http://localhost:3000/api/migrate/trackers}';

    protected $description = 'Imports legacy trackers, rank lists, and their user/event associations from the old system API.';

    public function handle(): int
    {
        $url = (string) $this->option('url');
        $this->info('Fetching trackers from: '.$url);

        $response = Http::timeout(60)->acceptJson()->get($url);
        if (! $response->ok()) {
            $this->error('Failed to fetch trackers. HTTP status: '.$response->status());

            return self::FAILURE;
        }

        $payload = $response->json();
        if (! is_array($payload) || ! Arr::get($payload, 'success')) {
            $this->error('Unexpected response shape or success=false.');

            return self::FAILURE;
        }

        $trackers = Arr::get($payload, 'trackers', []);
        if (! is_array($trackers) || empty($trackers)) {
            $this->warn('No trackers found to import.');

            return self::SUCCESS;
        }

        // Upsert trackers first
        $trackerRows = collect($trackers)->map(function (array $t): array {
            $createdAt = Arr::get($t, 'createdAt');
            $updatedAt = Arr::get($t, 'updatedAt');
            $status = $this->normalizeStatus(Arr::get($t, 'status'));

            return [
                'title' => (string) Arr::get($t, 'title'),
                'slug' => (string) Arr::get($t, 'slug'),
                'description' => Arr::get($t, 'description'),
                'status' => $status,
                'order' => (int) Arr::get($t, 'order', 0),
                'created_at' => $createdAt ? Carbon::parse($createdAt) : now(),
                'updated_at' => $updatedAt ? Carbon::parse($updatedAt) : now(),
            ];
        });

        $this->info('Upserting '.$trackerRows->count().' trackers...');
        $trackerRows->chunk(500)->each(function ($chunk) {
            Tracker::query()->upsert(
                $chunk->all(),
                uniqueBy: ['slug'],
                update: ['title', 'description', 'status', 'order', 'created_at', 'updated_at']
            );
        });

        // Resolve tracker IDs by slug
        $slugToId = Tracker::query()
            ->whereIn('slug', $trackerRows->pluck('slug')->unique()->values())
            ->pluck('id', 'slug')
            ->all();

        // Prepare RankLists rows
        $rankListRows = collect();
        foreach ($trackers as $t) {
            $slug = (string) Arr::get($t, 'slug');
            $trackerId = $slugToId[$slug] ?? null;
            if (! $trackerId) {
                continue;
            }
            $trackerStatus = $this->normalizeStatus(Arr::get($t, 'status'));
            foreach ((array) Arr::get($t, 'rankLists', []) as $rl) {
                $createdAt = Arr::get($rl, 'createdAt');
                $updatedAt = Arr::get($rl, 'updatedAt');
                $rankListRows->push([
                    'tracker_id' => $trackerId,
                    'keyword' => (string) Arr::get($rl, 'keyword'),
                    'description' => Arr::get($rl, 'description'),
                    'weight_of_upsolve' => (float) Arr::get($rl, 'weightOfUpsolve', 0),
                    'status' => $trackerStatus,
                    'order' => (int) Arr::get($rl, 'order', 0),
                    'is_active' => (bool) Arr::get($rl, 'isActive', true),
                    'consider_strict_attendance' => (bool) Arr::get($rl, 'considerStrictAttendance', true),
                    'created_at' => $createdAt ? Carbon::parse($createdAt) : now(),
                    'updated_at' => $updatedAt ? Carbon::parse($updatedAt) : now(),
                ]);
            }
        }

        if ($rankListRows->isEmpty()) {
            $this->info('No rank lists to import.');

            return self::SUCCESS;
        }

        $this->info('Upserting '.$rankListRows->count().' rank lists...');
        $rankListRows->chunk(500)->each(function ($chunk) {
            RankList::query()->upsert(
                $chunk->all(),
                uniqueBy: ['tracker_id', 'keyword'],
                update: [
                    'description',
                    'weight_of_upsolve',
                    'status',
                    'order',
                    'is_active',
                    'consider_strict_attendance',
                    'created_at',
                    'updated_at',
                ]
            );
        });

        // Resolve RankList IDs by (tracker_id, keyword)
        $rankListKeyed = RankList::query()
            ->whereIn('tracker_id', array_values($slugToId))
            ->get(['id', 'tracker_id', 'keyword'])
            ->reduce(function ($carry, $item) {
                $carry[$item->tracker_id.'||'.$item->keyword] = $item->id;

                return $carry;
            }, []);

        // Build pivot rows for users and events
        $pivotUserRows = collect();
        $allEmails = collect();
        $eventAttachTuples = [];

        foreach ($trackers as $t) {
            $trackerId = $slugToId[(string) Arr::get($t, 'slug')] ?? null;
            if (! $trackerId) {
                continue;
            }
            foreach ((array) Arr::get($t, 'rankLists', []) as $rl) {
                $rankListId = $rankListKeyed[$trackerId.'||'.(string) Arr::get($rl, 'keyword')] ?? null;
                if (! $rankListId) {
                    continue;
                }

                // Users
                foreach ((array) Arr::get($rl, 'users', []) as $u) {
                    $email = (string) Arr::get($u, 'email');
                    if ($email !== '') {
                        $allEmails->push($email);
                        $pivotUserRows->push([
                            'rank_list_id' => $rankListId,
                            'email' => $email,
                            'score' => 0.0,
                        ]);
                    }
                }

                // Events
                foreach ((array) Arr::get($rl, 'events', []) as $e) {
                    $title = (string) Arr::get($e, 'title');
                    $link = Arr::get($e, 'eventLink');
                    $start = (string) Arr::get($e, 'startingAt');
                    $weight = (float) Arr::get($e, 'weight', 1.0);
                    if ($title === '' || ! $link || $start === '') {
                        continue;
                    }
                    $eventAttachTuples[] = [
                        'rank_list_id' => $rankListId,
                        'title' => $title,
                        'link' => $link,
                        'starting_at' => Carbon::parse($start),
                        'weight' => $weight,
                    ];
                }
            }
        }

        // Resolve user IDs
        $emailToId = User::query()
            ->whereIn('email', $allEmails->unique()->filter()->values())
            ->pluck('id', 'email')
            ->all();

        // Upsert rank_list_user and report missing users
        if ($pivotUserRows->isNotEmpty()) {
            $this->info('Upserting '.$pivotUserRows->count().' rank list users...');

            $missingUsers = $pivotUserRows
                ->filter(fn ($row) => ! isset($emailToId[$row['email']]))
                ->values();

            foreach ($missingUsers as $mu) {
                $this->error('User not found: '.$mu['email'].' (rank_list_id: '.$mu['rank_list_id'].')');
            }
            $pivotUserRows
                ->map(function ($row) use ($emailToId) {
                    $userId = $emailToId[$row['email']] ?? null;
                    if (! $userId) {
                        return null;
                    }

                    return [
                        'rank_list_id' => $row['rank_list_id'],
                        'user_id' => $userId,
                        'score' => $row['score'],
                    ];
                })
                ->filter()
                ->chunk(1000)
                ->each(function ($chunk) {
                    DB::table('rank_list_user')->upsert(
                        $chunk->all(),
                        uniqueBy: ['rank_list_id', 'user_id'],
                        update: ['score']
                    );
                });
        }

        // Attach events to rank lists, matching by title + event_link + starting_at
        if (! empty($eventAttachTuples)) {
            $this->info('Linking events to rank lists...');
            $pivotEventRows = collect();
            $missingEvents = [];
            foreach ($eventAttachTuples as $tuple) {
                $eventId = Event::query()
                    ->where('title', $tuple['title'])
                    ->where('event_link', $tuple['link'])
                    ->where('starting_at', $tuple['starting_at'])
                    ->value('id');
                if (! $eventId) {
                    $missingEvents[] = $tuple;

                    continue;
                }
                $pivotEventRows->push([
                    'event_id' => $eventId,
                    'rank_list_id' => $tuple['rank_list_id'],
                    'weight' => (float) ($tuple['weight'] ?? 1.0),
                ]);
            }

            foreach ($missingEvents as $me) {
                $this->error('Event not found: title="'.$me['title'].'", link='.$me['link'].', starting_at='.$me['starting_at']);
            }

            if ($pivotEventRows->isNotEmpty()) {
                $pivotEventRows->chunk(1000)->each(function ($chunk) {
                    DB::table('event_rank_list')->upsert(
                        $chunk->all(),
                        uniqueBy: ['event_id', 'rank_list_id'],
                        update: ['weight']
                    );
                });
            }
        }

        $this->info('Tracker import complete.');

        return self::SUCCESS;
    }

    protected function normalizeStatus(mixed $value): string
    {
        $v = strtolower((string) $value);

        return match ($v) {
            'published', 'public' => 'public',
            'draft' => 'draft',
            default => 'public',
        };
    }
}
