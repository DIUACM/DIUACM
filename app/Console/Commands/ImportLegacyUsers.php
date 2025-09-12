<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class ImportLegacyUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * You can override the source URL with --url=... if needed.
     */
    protected $signature = 'app:import-legacy-users {--url=http://localhost:3000/api/migrate/users} {--verify-passwords : Verify that imported passwords work correctly}';

    /**
     * The console command description.
     */
    protected $description = 'Imports legacy users from the Next.js API and upserts them into the database, preserving timestamps and ensuring password compatibility.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $url = (string) $this->option('url');
        $verifyPasswords = $this->option('verify-passwords');

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

        // Show pagination info
        $totalCount = Arr::get($payload, 'totalCount', count($users));
        $currentPage = Arr::get($payload, 'currentPage', 1);
        $totalPages = Arr::get($payload, 'totalPages', 1);
        $this->info("Processing page {$currentPage} of {$totalPages} (Total users: {$totalCount})");

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
                $password = $this->ensureLaravelPassword($rawPassword);
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
        $invalidCount = 0;
        foreach ($rows as $row) {
            if (! isset($row['email']) || $row['email'] === '') {
                $this->error('User row missing email. name="'.($row['name'] ?? '').'"');
                $invalidCount++;
            }
            if (! isset($row['username']) || $row['username'] === '') {
                $this->error('User row missing username. email="'.($row['email'] ?? '').'"');
                $invalidCount++;
            }
        }

        if ($invalidCount > 0) {
            $this->warn("Found {$invalidCount} users with missing required fields.");
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
        $processedCount = 0;
        
        collect($rows)->chunk($chunkSize)->each(function ($chunk) use (&$processedCount) {
            // Filter out rows with missing emails before upserting
            $validChunk = $chunk->filter(fn($row) => !empty($row['email']));
            
            if ($validChunk->isEmpty()) {
                return;
            }

            // Upsert by unique email; update on conflict for these columns
            User::query()->upsert(
                $validChunk->all(),
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
            
            $processedCount += $validChunk->count();
            $this->info("Processed {$processedCount} users...");
        });

        $this->info('Import complete. Created ~'.$createdCount.', updated ~'.(count($rows) - $createdCount).'.');

        // Optional password verification
        if ($verifyPasswords && $createdCount > 0) {
            $this->info('Verifying password compatibility...');
            $this->verifyPasswordCompatibility($emails->take(5)->toArray());
        }

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
     * Ensure password is in Laravel-compatible format.
     */
    protected function ensureLaravelPassword(string $password): ?string
    {
        // Check if it's already a Laravel-compatible hash
        if (str_starts_with($password, '$2y$') || 
            str_starts_with($password, '$argon2') ||
            str_starts_with($password, '$argon2i') ||
            str_starts_with($password, '$argon2id')) {
            return $password;
        }

        // Convert other bcrypt variants to Laravel format
        if (str_starts_with($password, '$2a$') || str_starts_with($password, '$2b$')) {
            return preg_replace('/^\$2[ab]\$/', '$2y$', $password);
        }

        // If it's not a recognizable hash format, it might be plain text (shouldn't happen with the API)
        // Hash it for security (this is a fallback)
        if (strlen($password) < 60) { // bcrypt hashes are typically 60 characters
            return Hash::make($password);
        }

        // Return as-is if we can't determine the format
        return $password;
    }

    /**
     * Verify that imported passwords work correctly with Laravel's Hash::check().
     */
    protected function verifyPasswordCompatibility(array $emails): void
    {
        $testUsers = User::whereIn('email', $emails)->whereNotNull('password')->take(3)->get();

        foreach ($testUsers as $user) {
            if ($user->password) {
                // Test if the password format is compatible with Laravel's Hash facade
                $isCompatible = $this->isHashFormatCompatible($user->password);
                
                if ($isCompatible) {
                    $this->info("✓ Password for {$user->email} is Laravel-compatible");
                } else {
                    $this->warn("⚠ Password for {$user->email} may not be Laravel-compatible");
                }
            }
        }
    }

    /**
     * Check if a hash format is compatible with Laravel's Hash facade.
     */
    protected function isHashFormatCompatible(string $hash): bool
    {
        // Laravel supports bcrypt ($2y$) and Argon2 hashes
        return str_starts_with($hash, '$2y$') || 
               str_starts_with($hash, '$argon2') ||
               str_starts_with($hash, '$argon2i') ||
               str_starts_with($hash, '$argon2id');
    }
}