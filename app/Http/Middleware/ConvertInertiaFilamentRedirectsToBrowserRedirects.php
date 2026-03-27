<?php

namespace App\Http\Middleware;

use Closure;
use Filament\Facades\Filament;
use Illuminate\Http\Request;
use Inertia\Support\Header;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

class ConvertInertiaFilamentRedirectsToBrowserRedirects
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->header(Header::INERTIA) || ! $response instanceof RedirectResponse) {
            return $response;
        }

        if (! $this->isFilamentRedirect($request, $response->getTargetUrl())) {
            return $response;
        }

        $response->setStatusCode(Response::HTTP_CONFLICT);
        $response->setContent('');
        $response->headers->remove('Location');
        $response->headers->set(Header::LOCATION, $response->getTargetUrl());
        $response->headers->set('Vary', Header::INERTIA);

        return $response;
    }

    private function isFilamentRedirect(Request $request, string $targetUrl): bool
    {
        $targetHost = parse_url($targetUrl, PHP_URL_HOST);

        if (($targetHost !== null) && ($targetHost !== $request->getHost())) {
            return false;
        }

        $targetPath = trim((string) parse_url($targetUrl, PHP_URL_PATH), '/');

        if ($targetPath === '') {
            return false;
        }

        foreach (Filament::getPanels() as $panel) {
            $panelPath = trim($panel->getPath(), '/');

            if ($panelPath === '') {
                continue;
            }

            if (($targetPath === $panelPath) || str_starts_with($targetPath, $panelPath.'/')) {
                return true;
            }
        }

        return false;
    }
}
