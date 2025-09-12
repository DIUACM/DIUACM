<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Disable CSRF middleware for feature tests (Laravel 12 uses ValidateCsrfToken)
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        // Safety guard: ensure tests run against SQLite (file or in-memory)
        $defaultConnection = Config::get('database.default');
        $databaseName = Config::get("database.connections.$defaultConnection.database");

        // If someone forces MySQL/PGSQL for tests, fail fast to protect real data
        $isSqlite = $defaultConnection === 'sqlite';
        $isAllowedDatabase = str_contains((string) $databaseName, 'database/testing.sqlite')
            || (string) $databaseName === ':memory:';

        if (! $isSqlite || ! $isAllowedDatabase) {
            $message = sprintf(
                'Tests must use sqlite (database/testing.sqlite or :memory:). Current: connection=%s, database=%s',
                (string) $defaultConnection,
                (string) $databaseName,
            );

            throw new \RuntimeException($message);
        }
    }
}
