<?php

use App\Http\Middleware\ConvertInertiaFilamentRedirectsToBrowserRedirects;
use App\Http\Middleware\EnsureUserIsNotBanned;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Sentry\Laravel\Integration;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance']);

        $middleware->validateCsrfTokens(except: [
            'payments/callback/*',
            'payments/ipn/*',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            EnsureUserIsNotBanned::class,
            ConvertInertiaFilamentRedirectsToBrowserRedirects::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if (! app()->environment(['local', 'testing']) && in_array($response->getStatusCode(), [500, 503, 404, 403])) {
                return Inertia::render('error-page', ['status' => $response->getStatusCode(),
                    'auth' => [
                        'user' => $request->user(),
                    ],
                ])
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            } elseif ($response->getStatusCode() === 419) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'The page expired, please try again.',
                ]);

                return back();
            }

            return $response;
        });
        Integration::handles($exceptions);
    })->create();
