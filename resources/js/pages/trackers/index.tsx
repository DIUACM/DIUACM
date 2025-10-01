import { CustomPagination } from '@/components/ui/custom-pagination';
import { TrackerCard, TrackerListItem } from '@/components/trackers/tracker-card';
import { TrackersFilters } from '@/components/trackers/trackers-filters';
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';

type PaginatedTrackers = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: TrackerListItem[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

type TrackersPageProps = {
    trackers: PaginatedTrackers;
    filters: {
        search?: string;
    };
};

export default function TrackersPage({ trackers, filters }: TrackersPageProps) {
    return (
        <MainLayout>
            <Head title="Trackers" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Trackers</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Track performance and rankings across contests and events.</p>
                </div>

                <div className="mb-6">
                    <TrackersFilters filters={filters} />
                </div>

                <div className="space-y-4">
                    {trackers.data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="mb-4 text-6xl">📊</div>
                            <p className="mb-2 text-lg text-slate-500">No trackers found</p>
                            <p className="text-sm text-slate-400">
                                {Object.values(filters).some(Boolean)
                                    ? 'Try adjusting your filters to see more trackers.'
                                    : 'There are no trackers available at the moment.'}
                            </p>
                        </div>
                    )}
                    {trackers.data.map((tracker) => (
                        <TrackerCard key={tracker.id} tracker={tracker} />
                    ))}
                </div>

                {trackers.data.length > 0 && trackers.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={trackers.current_page} totalPages={trackers.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
