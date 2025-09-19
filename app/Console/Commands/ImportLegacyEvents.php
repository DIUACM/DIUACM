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
    protected $signature = 'app:import-legacy-events {--url=http://localhost:3000/api/migrate/events} {--page=1} {--limit=500} {--dry-run : Show what would be imported without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Imports legacy events from the Next.js API and upserts them into the database, preserving timestamps and handling attendance data.';

    public function handle(): int
    {
        $url = (string) $this->option('url');
        $page = (int) $this->option('page');
        $limit = (int) $this->option('limit');
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE: No changes will be made to the database.');
        }

        $totalProcessed = 0;
        $currentPage = $page;

        do {
            $pageUrl = $url."?page={$currentPage}&limit={$limit}";
            $this->info("Fetching events from: {$pageUrl}");

            $response = Http::timeout(120)->acceptJson()->get($pageUrl);

            if (! $response->ok()) {
                $this->error("Failed to fetch events. HTTP status: {$response->status()}");

                return self::FAILURE;
            }

            $payload = $response->json();

            if (! is_array($payload) || ! Arr::get($payload, 'success')) {
                $this->error('Unexpected response shape or success=false.');

                return self::FAILURE;
            }

            $events = Arr::get($payload, 'events', []);
            $totalCount = Arr::get($payload, 'totalCount', 0);
            $totalPages = Arr::get($payload, 'totalPages', 1);
            $hasNextPage = Arr::get($payload, 'hasNextPage', false);

            if (! is_array($events) || empty($events)) {
                if ($currentPage === 1) {
                    $this->warn('No events found to import.');

                    return self::SUCCESS;
                } else {
                    $this->info('No more events to process.');
                    break;
                }
            }

            $this->info("Processing page {$currentPage} of {$totalPages} ({$totalCount} total events)");

            $result = $this->processEventsPage($events, $dryRun);

            if (! $result) {
                $this->error('Failed to process events page.');

                return self::FAILURE;
            }

            $totalProcessed += count($events);
            $this->info("Processed {$totalProcessed} events so far...");

            $currentPage++;
        } while ($hasNextPage && $currentPage <= $totalPages);

        $this->info("Event import complete. Processed {$totalProcessed} events total.");

        if ($dryRun) {
            $this->warn('DRY RUN completed - no actual changes were made.');
        }

        return self::SUCCESS;
    }

    protected function processEventsPage(array $events, bool $dryRun): bool
    {
        try {
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

            if ($dryRun) {
                $this->info("Would process {$withLink->count()} events with links and {$withoutLink->count()} events without links");
            } else {
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
            }

            // Process attendance data
            $this->processAttendanceData($events, $dryRun);

            return true;
        } catch (\Exception $e) {
            $this->error('Error processing events page: '.$e->getMessage());

            return false;
        }
    }

    protected function processAttendanceData(array $events, bool $dryRun): void
    {
        // Build attendance payloads from source to preserve timestamps
        $attendanceByLink = [];
        $attendanceByComposite = [];
        $allEmails = collect();

        foreach ($events as $e) {
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

        if ($allEmails->isEmpty()) {
            return;
        }

        if ($dryRun) {
            $this->info("Would process attendance for {$allEmails->unique()->count()} unique attendees");

            return;
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
                // Note: Adjust table name if different in your Laravel app
                DB::table('event_attendance')->upsert(
                    $chunk->all(),
                    uniqueBy: ['event_id', 'user_id'],
                    update: ['created_at', 'updated_at']
                );
            });
        }
    }

    protected function normalizeStatus(mixed $value): string
    {
        $v = strtolower((string) $value);

        return match ($v) {
            'published', 'public' => 'published',
            'draft' => 'draft',
            default => 'published',
        };
    }

    protected function normalizeType(mixed $value): string
    {
        $v = strtolower((string) $value);
        $allowed = ['contest', 'class', 'other'];

        if (! in_array($v, $allowed, true)) {
            throw new \InvalidArgumentException("Invalid event type value: '{$value}'. Allowed values are: ".implode(', ', $allowed));
        }

        return $v;
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

        if (! in_array($v, $allowed, true)) {
            throw new \InvalidArgumentException("Invalid participation scope value: '{$value}'. Allowed values are: ".implode(', ', $allowed));
        }

        return $v;
    }
}
