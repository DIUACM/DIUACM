import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import MainLayout from '@/layouts/main-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, CalendarDays, Clock, Search as SearchIcon, Users } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type EventItem = {
    id: number;
    title: string;
    starting_at: string;
    ending_at: string;
    event_link?: string | null;
    open_for_attendance: boolean;
    type: 'contest' | 'class' | 'other';
    participation_scope: 'open_for_all' | 'only_girls' | 'junior_programmers' | 'selected_persons';
    attendees_count?: number;
};

type PageProps = {
    events: EventItem[];
    pagination: { page: number; pages: number; total: number; limit: number };
    filters: { title?: string | null };
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

function formatRange(startStr: string, endStr: string) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const f = (dt: Date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dt);
    return `${f(s)} - ${f(e)}`;
}

function typeLabel(t: EventItem['type']) {
    return t === 'contest' ? 'Contest' : t === 'class' ? 'Class' : 'Other';
}

function scopeLabel(s: EventItem['participation_scope']) {
    switch (s) {
        case 'open_for_all':
            return 'Open for All';
        case 'only_girls':
            return 'Only Girls';
        case 'junior_programmers':
            return 'Junior Programmers';
        case 'selected_persons':
            return 'Selected Persons';
        default:
            return 'Open for All';
    }
}

function StatusBadge({ start, end }: { start: string; end: string }) {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    let label = 'Upcoming';
    let cls = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30';
    if (now >= s && now <= e) {
        label = 'Running';
        cls = 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300/70 dark:border-blue-700/70 text-blue-700 dark:text-blue-300';
    } else if (now > e) {
        label = 'In Past';
        cls = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
    return (
        <Badge variant="outline" className={cls}>
            {label}
        </Badge>
    );
}

function EventsFilters({ current }: { current: PageProps['filters'] }) {
    const [search, setSearch] = useState<string>(current.title ?? '');
    const mounted = useRef(false);

    useEffect(() => {
        setSearch(current.title ?? '');
    }, [current.title]);

    // Debounced live search using Inertia router with better state preservation
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        const id = setTimeout(() => {
            const q = search.trim();
            const data = q ? { title: q } : {};
            router.get(window.location.pathname, data, {
                replace: true,
                preserveScroll: true,
                preserveState: true,
                only: ['events', 'pagination', 'filters'],
            });
        }, 400);
        return () => clearTimeout(id);
    }, [search]);

    return (
        <div>
            <Card className="mb-4 border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1">
                        <div className="relative">
                            <Input
                                type="search"
                                placeholder="Search events..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-10"
                                aria-label="Search events"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                                <SearchIcon className="h-4 w-4" />
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Active filters UI removed per request */}
        </div>
    );
}

function EventsList({ items }: { items: EventItem[] }) {
    return (
        <div className="mb-8 space-y-4">
            {items.map((event) => (
                <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    prefetch="hover"
                    className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-slate-50 opacity-50 dark:from-slate-800 dark:to-slate-900" />
                    <div className="absolute -right-10 -bottom-10 -z-10 h-24 w-24 rounded-full bg-blue-100/40 dark:bg-blue-900/20" />

                    <div className="relative z-10 p-5">
                        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div className="flex-1">
                                <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600 sm:text-lg dark:text-white dark:group-hover:text-blue-400">
                                    {event.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays className="h-4 w-4 text-blue-500" />
                                        <span>{formatDate(event.starting_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span>{formatRange(event.starting_at, event.ending_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:self-start">
                                <StatusBadge start={event.starting_at} end={event.ending_at} />
                            </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                                {typeLabel(event.type)}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                                {scopeLabel(event.participation_scope)}
                            </Badge>
                            {typeof event.attendees_count === 'number' && event.open_for_attendance && (
                                <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                                    <Users className="mr-1 h-3.5 w-3.5" /> {event.attendees_count}{' '}
                                    {event.attendees_count === 1 ? 'attendee' : 'attendees'}
                                </Badge>
                            )}
                        </div>

                        <div className="absolute right-4 bottom-4 flex h-8 w-8 transform items-center justify-center rounded-full bg-blue-100 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 dark:bg-blue-900/50">
                            <ArrowUpRight className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function Pager({ page, pages, filters }: { page: number; pages: number; filters?: { title?: string | null } }) {
    const go = (n: number) => {
        const data: Record<string, string | number> = { page: n };
        if (filters?.title) data.title = filters.title;
        router.get(window.location.pathname, data, {
            preserveScroll: true,
            preserveState: true,
            replace: false,
            only: ['events', 'pagination'],
        });
    };

    if (pages <= 1) return null;

    const items = [] as React.ReactElement[];
    const maxVisible = 5;

    items.push(
        <PaginationItem key="first">
            <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(1))} isActive={page === 1}>
                1
            </PaginationLink>
        </PaginationItem>,
    );

    if (page > 3)
        items.push(
            <PaginationItem key="es">
                <PaginationEllipsis />
            </PaginationItem>,
        );

    let start = Math.max(2, page - 1);
    let end = Math.min(pages - 1, page + 1);
    if (page <= 3) end = Math.min(pages - 1, maxVisible - 1);
    if (page >= pages - 2) start = Math.max(2, pages - (maxVisible - 2));

    for (let i = start; i <= end; i++) {
        items.push(
            <PaginationItem key={i}>
                <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(i))} isActive={page === i}>
                    {i}
                </PaginationLink>
            </PaginationItem>,
        );
    }

    if (page < pages - 2)
        items.push(
            <PaginationItem key="ee">
                <PaginationEllipsis />
            </PaginationItem>,
        );

    if (pages > 1) {
        items.push(
            <PaginationItem key="last">
                <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(pages))} isActive={page === pages}>
                    {pages}
                </PaginationLink>
            </PaginationItem>,
        );
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) go(page - 1);
                        }}
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={page === 1 ? -1 : 0}
                    />
                </PaginationItem>
                {items}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page < pages) go(page + 1);
                        }}
                        aria-disabled={page === pages}
                        className={page === pages ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={page === pages ? -1 : 0}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

export default function EventsIndex() {
    const { props } = usePage<PageProps>();
    const { events, pagination, filters } = props;

    const hasResults = events.length > 0;
    const hasActive = !!filters.title;

    return (
        <MainLayout title="Events">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Events</h1>
                    <p className="text-slate-600 dark:text-slate-300">Discover and register for upcoming workshops, competitions, and more</p>
                </div>

                <div className="mb-6">
                    <EventsFilters current={filters} />
                </div>

                <div className="mb-6">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white">
                                    <CalendarDays className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    {pagination.total} {pagination.total === 1 ? 'Event' : 'Events'}
                                    {hasActive ? ' found' : ''}
                                </h2>
                                {hasActive && pagination.total > 0 && (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Showing page {pagination.page} of {pagination.pages}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {hasResults ? (
                    <>
                        <EventsList items={events} />
                        {pagination.pages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pager page={pagination.page} pages={pagination.pages} filters={filters} />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <SearchIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No events found</h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                            {hasActive
                                ? 'Try adjusting your filters or check back later for more events.'
                                : 'There are no upcoming events scheduled at the moment. Check back soon!'}
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
