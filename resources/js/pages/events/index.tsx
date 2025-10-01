import { EventCard, EventListItem } from '@/components/events/event-card';
import { EventsFilters } from '@/components/events/events-filters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';

type PaginatedEvents = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: EventListItem[];
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

type EventsPageProps = {
    events: PaginatedEvents;
    filters: {
        search?: string;
        type?: string;
        participation_scope?: string;
    };
};

export default function EventsPage({ events, filters }: EventsPageProps) {
    return (
        <MainLayout>
            <Head title="Events" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Join contests, classes, and more.</p>
                </div>

                <div className="mb-6">
                    <EventsFilters filters={filters} />
                </div>

                <div className="space-y-4">
                    {events.data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="mb-4 text-6xl">📅</div>
                            <p className="mb-2 text-lg text-slate-500">No events found</p>
                            <p className="text-sm text-slate-400">
                                {Object.values(filters).some(Boolean)
                                    ? 'Try adjusting your filters to see more events.'
                                    : 'There are no events available at the moment.'}
                            </p>
                        </div>
                    )}
                    {events.data.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>

                {events.data.length > 0 && events.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={events.current_page} totalPages={events.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
