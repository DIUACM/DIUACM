<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMigrationExportApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('services.migration_export.api_key');

        if (! is_string($expectedKey) || $expectedKey === '') {
            return response()->json([
                'message' => 'Migration export API key is not configured.',
            ], 503);
        }

        $providedKey = $request->header('X-Migration-Export-Key') ?? $request->query('api_key');

        if (! is_string($providedKey) || $providedKey === '') {
            return response()->json([
                'message' => 'Migration export API key is required.',
            ], 401);
        }

        if (! hash_equals($expectedKey, $providedKey)) {
            return response()->json([
                'message' => 'Invalid migration export API key.',
            ], 403);
        }

        return $next($request);
    }
}
