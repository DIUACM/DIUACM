import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Home, RefreshCw, Shield, Wrench } from 'lucide-react';

interface ErrorPageProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorPageProps) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
    }[status] || `${status}: Error`;

    const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
    }[status] || 'An unexpected error occurred.';

    const icon = {
        503: Wrench,
        500: AlertTriangle,
        404: Home,
        403: Shield,
    }[status] || AlertTriangle;

    const Icon = icon;

    const suggestion = {
        503: 'Our team is working to restore the service. Please try again in a few minutes.',
        500: 'We\'ve been notified about this issue and are working to fix it.',
        404: 'Check the URL for typos, or use the navigation menu to find what you\'re looking for.',
        403: 'If you believe you should have access to this page, please contact support.',
    }[status] || 'Please try refreshing the page or contact support if the problem persists.';

    return (
        <MainLayout>
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="max-w-2xl w-full text-center">
                    {/* Error Icon */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 -z-10">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-red-100/60 blur-xl dark:bg-red-900/30" />
                        </div>
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 border-4 border-red-200 dark:bg-red-900/30 dark:border-red-800/50">
                            <Icon className="h-12 w-12 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Error Content */}
                    <div className="mb-8">
                        <h1 className="mb-4 text-6xl font-bold text-slate-900 dark:text-white">
                            {status}
                        </h1>
                        <h2 className="mb-4 text-2xl font-semibold text-slate-700 dark:text-slate-300">
                            {title.split(': ')[1] || title}
                        </h2>
                        <p className="mb-6 text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            {description}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 max-w-lg mx-auto">
                            {suggestion}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="min-w-[160px] rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                        >
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="min-w-[160px] rounded-full border border-slate-200 bg-white/80 px-8 font-medium text-slate-700 shadow-md backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>

                    {/* Additional Help */}
                    {status === 404 && (
                        <div className="mt-12 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                                Popular Pages
                            </h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Button asChild variant="link" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Link href="/about">About DIU ACM</Link>
                                </Button>
                                <Button asChild variant="link" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Link href="/events">Events</Link>
                                </Button>
                                <Button asChild variant="link" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Link href="/contact">Contact</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === 500 && (
                        <div className="mt-12 p-6 rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                <strong>Error ID:</strong> {Date.now().toString(36).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                Please include this ID when contacting support
                            </p>
                        </div>
                    )}

                    {status === 503 && (
                        <div className="mt-12 p-6 rounded-2xl border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Follow us on social media for maintenance updates and announcements.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}