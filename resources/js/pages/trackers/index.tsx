import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';

type TrackerItem = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    ranklists_count: number;
};

type PageProps = {
    trackers: TrackerItem[];
};

export default function TrackersIndex() {
    const { props } = usePage<PageProps>();
    const trackers = props.trackers || [];

    return (
        <MainLayout title="Contest Trackers">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Contest{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Trackers
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                        Track contest performance and programming rankings for DIU ACM community members
                    </p>
                </div>

                {trackers.length > 0 ? (
                    <div className="mb-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {trackers.map((t) => (
                                <Link key={t.id} href={`/trackers/${t.slug}`}>
                                    <Card className="h-full cursor-pointer transition-shadow duration-200 hover:shadow-lg">
                                        <CardContent className="h-full p-6">
                                            <div className="flex h-full flex-col">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                                                    </div>
                                                    <Badge variant="secondary">{t.ranklists_count} lists</Badge>
                                                </div>
                                                {t.description && (
                                                    <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <BarChart3 className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No trackers found</h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                            There are no contest trackers available yet. Check back soon for ranking updates!
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
