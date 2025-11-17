import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import type { Tracker } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';

type TrackersPageProps = {
    trackers: Tracker[];
};

export default function TrackersPage({ trackers }: TrackersPageProps) {
    return (
        <MainLayout>
            <Head title="Performance Trackers" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Performance Trackers</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Track competitive programming performance across various contests and events.
                    </p>
                </div>

                {trackers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="mb-4 text-6xl">📊</div>
                        <p className="mb-2 text-lg text-slate-500 dark:text-slate-400">No trackers available</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            There are no performance trackers available at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {trackers.map((tracker) => (
                            <Link key={tracker.slug} href={`/trackers/${tracker.slug}`}>
                                <Card className="group cursor-pointer transition-all hover:shadow-lg dark:hover:shadow-slate-900/50">
                                    <CardHeader>
                                        <div className="mb-2 flex items-start justify-between">
                                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-3 dark:from-blue-900/20 dark:to-indigo-900/20">
                                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <CardTitle className="line-clamp-2 text-xl">
                                            {tracker.title}
                                        </CardTitle>
                                        {tracker.description && (
                                            <CardDescription className="line-clamp-3">
                                                {tracker.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
