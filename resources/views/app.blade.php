<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark']) data-appearance="{{ $appearance ?? 'system' }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <script>
        (function () {
            const root = document.documentElement;
            const appearance = root.dataset.appearance || 'system';
            const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

            const resolveAppearance = (mode) => {
                if (mode === 'light' || mode === 'dark') {
                    return mode;
                }

                return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
            };

            const resolved = resolveAppearance(appearance);

            root.classList.toggle('dark', resolved === 'dark');
            root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
            root.dataset.resolvedAppearance = resolved;
        })();
    </script>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @if(config('services.google_analytics.id') && app()->environment('production'))
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('services.google_analytics.id') }}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '{{ config('services.google_analytics.id') }}', {
            page_path: window.location.pathname,
        });
    </script>
    @endif

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>