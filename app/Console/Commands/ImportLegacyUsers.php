<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class ImportLegacyUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * You can override the source URL with --url=... if needed.
     */
    protected $signature = 'app:import-legacy-users {--url=http://localhost:3000/api/migrate/users}';

    /**
     * The console command description.
     */
    protected $description = 'Imports legacy users from the old system API and upserts them into the database, preserving timestamps.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $url = (string) $this->option('url');

        $this->info('Fetching users from: '.$url);

        $response = Http::timeout(60)->acceptJson()->get($url);

        if (! $response->ok()) {
            $this->error('Failed to fetch users. HTTP status: '.$response->status());

            return self::FAILURE;
        }

        $payload = $response->json();

        if (! is_array($payload) || ! Arr::get($payload, 'success')) {
            $this->error('Unexpected response shape or success=false.');

            return self::FAILURE;
        }

        $users = Arr::get($payload, 'users', []);
        if (! is_array($users) || empty($users)) {
            $this->warn('No users found to import.');

            return self::SUCCESS;
        }

        // Compute existing emails to estimate created vs updated counts.
        $emails = collect($users)
            ->map(fn ($u) => Arr::get($u, 'email'))
            ->filter()
            ->unique()
            ->values();

        $existingEmails = User::query()
            ->whereIn('email', $emails)
            ->pluck('email')
            ->all();

        $existingEmailSet = collect($existingEmails)->flip();

        $rows = collect($users)->map(function (array $u): array {
            $gender = $this->normalizeGender(Arr::get($u, 'gender'));

            $emailVerifiedAt = Arr::get($u, 'emailVerified');
            $createdAt = Arr::get($u, 'createdAt');
            $updatedAt = Arr::get($u, 'updatedAt');

            $rawPassword = Arr::get($u, 'password');
            $password = null;
            if (is_string($rawPassword) && $rawPassword !== '') {
                $password = $this->looksHashed($rawPassword) ? $rawPassword : password_hash($rawPassword, PASSWORD_BCRYPT);
            }

            return [
                'name' => (string) Arr::get($u, 'name'),
                'email' => (string) Arr::get($u, 'email'),
                'username' => (string) Arr::get($u, 'username'),
                'image' => Arr::get($u, 'image'),
                'email_verified_at' => $emailVerifiedAt ? Carbon::parse($emailVerifiedAt) : null,
                'password' => $password,
                'gender' => $gender,
                'phone' => Arr::get($u, 'phone'),
                'codeforces_handle' => Arr::get($u, 'codeforcesHandle'),
                'atcoder_handle' => Arr::get($u, 'atcoderHandle'),
                'vjudge_handle' => Arr::get($u, 'vjudgeHandle'),
                'department' => Arr::get($u, 'department'),
                'student_id' => Arr::get($u, 'studentId'),
                'max_cf_rating' => Arr::has($u, 'maxCfRating') ? (int) Arr::get($u, 'maxCfRating') : -1,
                'created_at' => $createdAt ? Carbon::parse($createdAt) : now(),
                'updated_at' => $updatedAt ? Carbon::parse($updatedAt) : now(),
            ];
        })->all();

        // Report invalid rows (missing email or username)
        foreach ($rows as $row) {
            if (! isset($row['email']) || $row['email'] === '') {
                $this->error('User row missing email. name="'.($row['name'] ?? '').'"');
            }
            if (! isset($row['username']) || $row['username'] === '') {
                $this->error('User row missing username. email="'.($row['email'] ?? '').'"');
            }
        }

        $createdCount = 0;
        foreach ($rows as $row) {
            if (! isset($row['email']) || $row['email'] === '') {
                continue;
            }

            if (! $existingEmailSet->has($row['email'])) {
                $createdCount++;
            }
        }

        $this->info('Upserting '.count($rows).' users...');

        // Perform upsert in chunks to avoid large single queries.
        $chunkSize = 500;
        collect($rows)->chunk($chunkSize)->each(function ($chunk) {
            // Upsert by unique email; update on conflict for these columns
            User::query()->upsert(
                $chunk->all(),
                uniqueBy: ['email'],
                update: [
                    'name',
                    'username',
                    'image',
                    'email_verified_at',
                    'password',
                    'gender',
                    'phone',
                    'codeforces_handle',
                    'atcoder_handle',
                    'vjudge_handle',
                    'department',
                    'student_id',
                    'max_cf_rating',
                    'created_at',
                    'updated_at',
                ]
            );
        });

        $this->info('Import complete. Created ~'.$createdCount.', updated ~'.(count($rows) - $createdCount).'.');

        return self::SUCCESS;
    }

    /**
     * Normalize incoming gender value to allowed enum strings or null.
     */
    protected function normalizeGender(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $v = strtolower((string) $value);

        return in_array($v, ['male', 'female', 'other'], true) ? $v : null;
    }

    /**
     * Best-effort detection if a password appears already hashed.
     */
    protected function looksHashed(string $password): bool
    {
        return str_starts_with($password, '$2y$') || str_starts_with($password, '$argon2');
    }
}
