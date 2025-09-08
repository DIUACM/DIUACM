<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ImportLegacyEvents extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:import-legacy-events {--url=http://localhost:3000/api/migrate/events}';

    /**
     * The console command description.
     */
    protected $description = 'Imports legacy events from the old system API and upserts them into the database, preserving timestamps.';

    public function handle(): int
    {
        $url = (string) $this->option('url');
        $this->info('Fetching events from: '.$url);

        $response = Http::timeout(60)->acceptJson()->get($url);
        if (! $response->ok()) {
            $this->error('Failed to fetch events. HTTP status: '.$response->status());

            return self::FAILURE;
        }

        $payload = $response->json();
        if (! is_array($payload) || ! Arr::get($payload, 'success')) {
            $this->error('Unexpected response shape or success=false.');

            return self::FAILURE;
        }

        $events = Arr::get($payload, 'events', []);
        if (! is_array($events) || empty($events)) {
            $this->warn('No events found to import.');

            return self::SUCCESS;
        }

        // Map rows into DB-ready payloads
        $rows = collect($events)->map(function (array $e): array {
            $createdAt = Arr::get($e, 'createdAt');
            $updatedAt = Arr::get($e, 'updatedAt');

            return [
                'title' => (string) Arr::get($e, 'title'),
                'description' => Arr::get($e, 'description'),
                'status' => $this->normalizeStatus(Arr::get($e, 'status')),
                'starting_at' => Carbon::parse((string) Arr::get($e, 'startingAt')),
                'ending_at' => Carbon::parse((string) Arr::get($e, 'endingAt')),
                'event_link' => Arr::get($e, 'eventLink'),
                'event_password' => Arr::get($e, 'eventPassword'),
                'open_for_attendance' => (bool) Arr::get($e, 'openForAttendance', false),
                'strict_attendance' => (bool) Arr::get($e, 'strictAttendance', false),
                'type' => $this->normalizeType(Arr::get($e, 'type')),
                'participation_scope' => $this->normalizeParticipation(Arr::get($e, 'participationScope')),
                'created_at' => $createdAt ? Carbon::parse($createdAt) : now(),
                'updated_at' => $updatedAt ? Carbon::parse($updatedAt) : now(),
            ];
        });

        $withLink = $rows->filter(fn ($r) => filled($r['event_link']))->values();
        $withoutLink = $rows->reject(fn ($r) => filled($r['event_link']))->values();

        // Upsert by unique event_link first
        if ($withLink->isNotEmpty()) {
            $this->info('Upserting '.$withLink->count().' events with links...');
            $withLink->chunk(500)->each(function ($chunk) {
                Event::query()->upsert(
                    $chunk->all(),
                    uniqueBy: ['event_link'],
                    update: [
                        'title',
                        'description',
                        'status',
                        'starting_at',
                        'ending_at',
                        'event_password',
                        'open_for_attendance',
                        'strict_attendance',
                        'type',
                        'participation_scope',
                        'created_at',
                        'updated_at',
                    ]
                );
            });
        }

        // For events without a link, fall back to updateOrInsert using title + starting_at as key
        if ($withoutLink->isNotEmpty()) {
            $this->info('Inserting/Updating '.$withoutLink->count().' events without links...');
            $withoutLink->each(function ($row) {
                DB::table('events')->updateOrInsert(
                    [
                        'title' => $row['title'],
                        'starting_at' => $row['starting_at'],
                    ],
                    [
                        'description' => $row['description'],
                        'status' => $row['status'],
                        'ending_at' => $row['ending_at'],
                        'event_link' => $row['event_link'], // null
                        'event_password' => $row['event_password'],
                        'open_for_attendance' => $row['open_for_attendance'],
                        'strict_attendance' => $row['strict_attendance'],
                        'type' => $row['type'],
                        'participation_scope' => $row['participation_scope'],
                        'created_at' => $row['created_at'],
                        'updated_at' => $row['updated_at'],
                    ]
                );
            });
        }

        // Build attendance payloads from source to preserve timestamps
        $sourceEvents = Arr::get($payload, 'events', []);

        $attendanceByLink = [];
        $attendanceByComposite = [];
        $allEmails = collect();

        foreach ($sourceEvents as $e) {
            $attendees = Arr::get($e, 'attendees', []);
            if (! is_array($attendees) || empty($attendees)) {
                continue;
            }

            $startingAt = Carbon::parse((string) Arr::get($e, 'startingAt'));
            $link = Arr::get($e, 'eventLink');

            $normalized = collect($attendees)->map(function ($a) {
                $email = (string) Arr::get($a, 'email');
                $attendedAt = Arr::get($a, 'attendedAt');
                $updatedAt = Arr::get($a, 'updatedAt');

                return [
                    'email' => $email,
                    'created_at' => $attendedAt ? Carbon::parse($attendedAt) : now(),
                    'updated_at' => $updatedAt ? Carbon::parse($updatedAt) : now(),
                ];
            })->all();

            $allEmails = $allEmails->merge(array_column($normalized, 'email'));

            if (filled($link)) {
                $attendanceByLink[$link] = $normalized;
            } else {
                $compositeKey = (string) Arr::get($e, 'title').'||'.$startingAt->toDateTimeString();
                $attendanceByComposite[$compositeKey] = $normalized;
            }
        }

        // Resolve users by email in bulk
        $emailToId = User::query()
            ->whereIn('email', $allEmails->unique()->filter()->values())
            ->pluck('id', 'email')
            ->all();

        // Resolve events by link
        $linkToId = [];
        if (! empty($attendanceByLink)) {
            $linkToId = Event::query()
                ->whereIn('event_link', array_keys($attendanceByLink))
                ->pluck('id', 'event_link')
                ->all();
        }

        // Resolve events by (title, starting_at)
        $compositeToId = [];
        if (! empty($attendanceByComposite)) {
            $titles = collect(array_keys($attendanceByComposite))
                ->map(fn ($k) => explode('||', $k)[0])
                ->unique()
                ->values();
            $starts = collect(array_keys($attendanceByComposite))
                ->map(fn ($k) => explode('||', $k)[1])
                ->unique()
                ->values();

            Event::query()
                ->whereIn('title', $titles)
                ->whereIn('starting_at', $starts)
                ->get(['id', 'title', 'starting_at'])
                ->each(function (Event $ev) use (&$compositeToId) {
                    $key = $ev->title.'||'.$ev->starting_at->toDateTimeString();
                    $compositeToId[$key] = $ev->id;
                });
        }

        // Build pivot rows
        $pivotRows = collect();

        foreach ($attendanceByLink as $link => $list) {
            $eventId = $linkToId[$link] ?? null;
            if (! $eventId) {
                $this->error('Event not found for attendance by link: '.$link);

                continue;
            }
            foreach ($list as $att) {
                $uid = $emailToId[$att['email']] ?? null;
                if (! $uid) {
                    $this->error('User not found for attendance: '.$att['email'].' (event_link: '.$link.')');

                    continue;
                }
                $pivotRows->push([
                    'event_id' => $eventId,
                    'user_id' => $uid,
                    'created_at' => $att['created_at'],
                    'updated_at' => $att['updated_at'],
                ]);
            }
        }

        foreach ($attendanceByComposite as $key => $list) {
            $eventId = $compositeToId[$key] ?? null;
            if (! $eventId) {
                $this->error('Event not found for attendance by composite key: '.$key);

                continue;
            }
            foreach ($list as $att) {
                $uid = $emailToId[$att['email']] ?? null;
                if (! $uid) {
                    $this->error('User not found for attendance: '.$att['email'].' (by composite: '.$key.')');

                    continue;
                }
                $pivotRows->push([
                    'event_id' => $eventId,
                    'user_id' => $uid,
                    'created_at' => $att['created_at'],
                    'updated_at' => $att['updated_at'],
                ]);
            }
        }

        if ($pivotRows->isNotEmpty()) {
            $this->info('Upserting '.$pivotRows->count().' attendance records...');
            $pivotRows->chunk(1000)->each(function ($chunk) {
                DB::table('event_attendance')->upsert(
                    $chunk->all(),
                    uniqueBy: ['event_id', 'user_id'],
                    update: ['created_at', 'updated_at']
                );
            });
        }

        $this->info('Event import complete.');

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

    protected function normalizeType(mixed $value): string
    {
        $v = strtolower((string) $value);

        return in_array($v, ['contest', 'class', 'other'], true) ? $v : 'other';
    }

    protected function normalizeParticipation(mixed $value): string
    {
        $v = strtolower((string) $value);
        $allowed = [
            'open_for_all',
            'only_girls',
            'junior_programmers',
            'selected_persons',
        ];

        return in_array($v, $allowed, true) ? $v : 'open_for_all';
    }
}
