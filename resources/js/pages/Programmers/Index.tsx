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
import { ArrowUpRight, MapPin, Search as SearchIcon, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type ProgrammerItem = {
    id: number;
    name: string;
    username: string;
    image?: string | null;
    department?: string | null;
    student_id?: string | null;
    max_cf_rating?: number | null;
    codeforces_handle?: string | null;
    atcoder_handle?: string | null;
    vjudge_handle?: string | null;
};

type PaginationData = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    data: ProgrammerItem[];
};

type PageProps = {
    programmers: PaginationData;
    filters: { search?: string | null; per_page?: number };
};

function getRatingColor(rating: number | null) {
    if (!rating || rating === -1) return 'bg-gray-500';
    if (rating >= 2400) return 'bg-red-500';
    if (rating >= 2100) return 'bg-orange-500';
    if (rating >= 1900) return 'bg-purple-500';
    if (rating >= 1600) return 'bg-blue-500';
    if (rating >= 1400) return 'bg-cyan-500';
    if (rating >= 1200) return 'bg-green-500';
    return 'bg-gray-500';
}

function getRatingTitle(rating: number | null) {
    if (!rating || rating === -1) return 'Unrated';
    if (rating >= 2400) return 'International Grandmaster';
    if (rating >= 2300) return 'Grandmaster';
    if (rating >= 2100) return 'International Master';
    if (rating >= 1900) return 'Candidate Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1400) return 'Specialist';
    if (rating >= 1200) return 'Pupil';
    return 'Newbie';
}

function ProgrammerFilters({ current }: { current: PageProps['filters'] }) {
    const [search, setSearch] = useState<string>(current.search ?? '');
    const mounted = useRef(false);

    useEffect(() => {
        setSearch(current.search ?? '');
    }, [current.search]);

    // Debounced live search
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        const id = setTimeout(() => {
            const q = search.trim();
            const data = q ? { search: q } : {};
            router.get(window.location.pathname, data, {
                replace: true,
                preserveScroll: true,
                preserveState: true,
                only: ['programmers', 'filters'],
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
                                placeholder="Search programmers by name, username, student ID, or department..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-10"
                                aria-label="Search programmers"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                                <SearchIcon className="h-4 w-4" />
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ProgrammerCard({ programmer }: { programmer: ProgrammerItem }) {
    const initials = programmer.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();

    return (
        <Link
            href={`/programmers/${programmer.username}`}
            prefetch="hover"
            className="group relative block overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
        >
            {/* Main Content */}
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-100 dark:ring-slate-600">
                        {programmer.image ? (
                            <img
                                src={programmer.image}
                                alt={programmer.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-medium text-white">
                                {initials}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 truncate">
                        {programmer.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        @{programmer.username}
                    </p>
                    
                    {/* Student ID if available */}
                    {programmer.student_id && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                            {programmer.student_id}
                        </p>
                    )}
                </div>

                {/* Rating Badge */}
                <div className="flex-shrink-0">
                    {programmer.max_cf_rating && programmer.max_cf_rating > -1 ? (
                        <Badge
                            className={`${getRatingColor(programmer.max_cf_rating)} text-white text-xs px-2 py-1`}
                        >
                            {programmer.max_cf_rating}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs px-2 py-1 text-slate-500">
                            Unrated
                        </Badge>
                    )}
                </div>
            </div>

            {/* Department */}
            {programmer.department && (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {programmer.department}
                </div>
            )}

            {/* Platform Handles - Only show if they exist */}
            {(programmer.codeforces_handle || programmer.atcoder_handle || programmer.vjudge_handle) && (
                <div className="mt-3 flex gap-1">
                    {programmer.codeforces_handle && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-blue-600 dark:text-blue-400">
                            CF
                        </Badge>
                    )}
                    {programmer.atcoder_handle && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-orange-600 dark:text-orange-400">
                            AC
                        </Badge>
                    )}
                    {programmer.vjudge_handle && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-green-600 dark:text-green-400">
                            VJ
                        </Badge>
                    )}
                </div>
            )}

            {/* Hover indicator */}
            <div className="absolute right-2 top-2 flex h-6 w-6 transform items-center justify-center rounded-full bg-blue-50 opacity-0 transition-all duration-200 group-hover:opacity-100 dark:bg-blue-900/50">
                <ArrowUpRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
        </Link>
    );
}

function ProgrammersList({ items }: { items: ProgrammerItem[] }) {
    return (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((programmer) => (
                <ProgrammerCard key={programmer.id} programmer={programmer} />
            ))}
        </div>
    );
}

function Pager({ 
    page, 
    pages, 
    filters 
}: { 
    page: number; 
    pages: number; 
    filters?: { search?: string | null } 
}) {
    const go = (n: number) => {
        const data: Record<string, string | number> = { page: n };
        if (filters?.search) data.search = filters.search;
        router.get(window.location.pathname, data, {
            preserveScroll: true,
            preserveState: true,
            replace: false,
            only: ['programmers'],
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

export default function ProgrammersIndex() {
    const { props } = usePage<PageProps>();
    const { programmers, filters } = props;

    const hasResults = programmers.data.length > 0;
    const hasSearch = !!filters.search;

    return (
        <MainLayout title="Programmers">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Programmers</h1>
                    <p className="text-slate-600 dark:text-slate-300">
                        Discover talented programmers from our community and their achievements
                    </p>
                </div>

                <div className="mb-6">
                    <ProgrammerFilters current={filters} />
                </div>

                <div className="mb-6">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white">
                                    <User className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    {programmers.total} {programmers.total === 1 ? 'Programmer' : 'Programmers'}
                                    {hasSearch ? ' found' : ''}
                                </h2>
                                {hasSearch && programmers.total > 0 && (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Showing page {programmers.current_page} of {programmers.last_page}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {hasResults ? (
                    <>
                        <ProgrammersList items={programmers.data} />
                        {programmers.last_page > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pager 
                                    page={programmers.current_page} 
                                    pages={programmers.last_page} 
                                    filters={filters} 
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <SearchIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No programmers found</h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                            {hasSearch
                                ? 'Try adjusting your search terms or check for typos.'
                                : 'There are no programmers registered at the moment.'}
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}