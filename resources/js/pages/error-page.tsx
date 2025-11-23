import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Home, RefreshCw, ServerCrash } from 'lucide-react';

type ErrorPageProps = {
    status: number;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
};

const errorMessages: Record<number, { title: string; description: string; icon: typeof ServerCrash }> = {
    403: {
        title: 'Access Forbidden',
        description: "You don't have permission to access this resource. Please contact an administrator if you believe this is a mistake.",
        icon: AlertCircle,
    },
    404: {
        title: 'Page Not Found',
        description: "The page you're looking for doesn't exist. It might have been moved or deleted.",
        icon: AlertCircle,
    },
    500: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Our team has been notified and is working to fix the issue.',
        icon: ServerCrash,
    },
    503: {
        title: 'Service Unavailable',
        description: "We're currently performing maintenance. Please check back shortly.",
        icon: ServerCrash,
    },
};

export default function ErrorPage({ status, auth }: ErrorPageProps) {
    const error = errorMessages[status] || {
        title: 'Error',
        description: 'An unexpected error occurred.',
        icon: AlertCircle,
    };

    const Icon = error.icon;

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/');
        }
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <MainLayout>
            <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-16">
                <div className="w-full max-w-2xl text-center">
                    {/* Error Icon and Status */}
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <div className="rounded-full bg-red-100 p-6 dark:bg-red-950/30">
                            <Icon className="h-16 w-16 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-8xl font-bold text-slate-800 dark:text-slate-200">{status}</div>
                    </div>

                    {/* Error Message */}
                    <div className="mb-8 space-y-4">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                            {error.title}
                        </h1>
                        <p className="mx-auto max-w-md text-lg text-slate-600 dark:text-slate-400">
                            {error.description}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button onClick={handleGoBack} variant="default" size="lg" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>

                        <Link href="/">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                <Home className="mr-2 h-4 w-4" />
                                Home Page
                            </Button>
                        </Link>

                        {status !== 403 && (
                            <Button onClick={handleRefresh} variant="ghost" size="lg" className="w-full sm:w-auto">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                        )}
                    </div>

                    {/* Additional Help */}
                    {status === 404 && (
                        <div className="mt-12">
                            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                Looking for something specific?
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Link href="/contests">
                                    <Button variant="link" size="sm">
                                        Contests
                                    </Button>
                                </Link>
                                <Link href="/events">
                                    <Button variant="link" size="sm">
                                        Events
                                    </Button>
                                </Link>
                                <Link href="/blog">
                                    <Button variant="link" size="sm">
                                        Blog
                                    </Button>
                                </Link>
                                <Link href="/about">
                                    <Button variant="link" size="sm">
                                        About
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="link" size="sm">
                                        Contact
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Support Information */}
                    {(status === 500 || status === 503) && (
                        <div className="mt-12 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                If this problem persists, please{' '}
                                <Link href="/contact" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                                    contact our support team
                                </Link>
                                .
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
