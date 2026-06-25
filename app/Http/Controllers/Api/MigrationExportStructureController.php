<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class MigrationExportStructureController extends Controller
{
    private const EXPORT_TABLES = [
        'users',
        'events',
        'trackers',
        'rank_lists',
        'event_attendance',
        'event_rank_list',
        'event_user_stats',
        'rank_list_user',
    ];

    /**
     * Handle the incoming request.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'endpoint' => [
                    'method' => 'GET',
                    'path' => route('api.migration.export', [], false),
                    'route_name' => 'api.migration.export',
                    'authentication' => 'API key required',
                    'api_key' => [
                        'env' => 'MIGRATION_EXPORT_API_KEY',
                        'header' => 'X-Migration-Export-Key',
                        'query_parameter' => 'api_key',
                    ],
                ],
                'response' => [
                    'content_type' => 'application/json',
                    'pagination' => false,
                    'root_key' => 'data',
                    'tables' => self::EXPORT_TABLES,
                    'structure' => $this->structure(),
                ],
                'example' => [
                    'data' => $this->example(),
                ],
            ],
        ]);
    }

    /**
     * @return array<string, list<array{name: string, type: string, nullable: bool, default: mixed}>>
     */
    private function structure(): array
    {
        $structure = [];

        foreach (self::EXPORT_TABLES as $table) {
            $structure[$table] = collect(Schema::getColumns($table))
                ->map(fn (array $column): array => [
                    'name' => (string) $column['name'],
                    'type' => (string) ($column['type'] ?? $column['type_name'] ?? 'unknown'),
                    'nullable' => (bool) ($column['nullable'] ?? false),
                    'default' => $column['default'] ?? null,
                ])
                ->values()
                ->all();
        }

        return $structure;
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function example(): array
    {
        $example = [];

        foreach (self::EXPORT_TABLES as $table) {
            $example[$table] = [$this->exampleRow($table)];
        }

        return $example;
    }

    /**
     * @return array<string, mixed>
     */
    private function exampleRow(string $table): array
    {
        return collect(Schema::getColumns($table))
            ->mapWithKeys(fn (array $column): array => [
                (string) $column['name'] => $this->exampleValue((string) $column['name'], (string) ($column['type'] ?? $column['type_name'] ?? '')),
            ])
            ->all();
    }

    private function exampleValue(string $column, string $type): mixed
    {
        if ($column === 'id' || str_ends_with($column, '_id')) {
            return 1;
        }

        if (str_contains($type, 'bool') || str_starts_with($column, 'is_') || in_array($column, ['open_for_attendance', 'strict_attendance', 'consider_partial_accept', 'participation'], true)) {
            return true;
        }

        if (str_contains($type, 'int') || in_array($column, ['order', 'position', 'solve_count', 'upsolve_count', 'max_cf_rating'], true)) {
            return 1;
        }

        if (str_contains($type, 'float') || str_contains($type, 'double') || in_array($column, ['weight', 'score', 'weight_of_upsolve'], true)) {
            return 1.5;
        }

        if (str_contains($column, '_at') || str_contains($type, 'date') || str_contains($type, 'time')) {
            return '2026-01-01T00:00:00+00:00';
        }

        return match ($column) {
            'name' => 'Example User',
            'email' => 'example@diu.edu.bd',
            'username' => 'example-user',
            'password' => '$2y$12$example-hashed-password',
            'remember_token' => 'example-remember-token',
            'gender' => 'male',
            'phone' => '+8801000000000',
            'codeforces_handle' => 'example_cf',
            'atcoder_handle' => 'example_ac',
            'vjudge_handle' => 'example_vj',
            'department' => 'CSE',
            'student_id' => 'DIU-12345678',
            'title' => 'Example Contest',
            'slug' => 'example-tracker',
            'description' => 'Example description.',
            'status' => 'published',
            'event_link' => 'https://example.com/contest',
            'event_password' => 'example-password',
            'type' => 'contest',
            'participation_scope' => 'open_for_all',
            'keyword' => 'example-ranklist',
            default => "example_{$column}",
        };
    }
}
