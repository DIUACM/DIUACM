import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { Input } from '@/components/ui/input';
import MainLayout from '@/layouts/main-layout';
import type { PaginatedData, Programmer } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Code, Filter, Hash, Search as SearchIcon, Trophy, User as UserIcon, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ProgrammersPageProps = {
    programmers: PaginatedData<Programmer>;
    filters: {
        search?: string;
        department?: string;
    };
};

type ProgrammerCardProps = {
    programmer: Programmer;
};

type ProgrammersFiltersProps = {
    filters: {
        search?: string;
        department?: string;
    };
};

export default function ProgrammersPage({ programmers, filters }: ProgrammersPageProps) {
    return (
        <MainLayout>
            <Head title="Programmers" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Programmers</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Discover talented programmers from our community, ranked by their competitive programming achievements.
                    </p>
                </div>

                <div className="mb-6">
                    <ProgrammersFilters filters={filters} />
                </div>

                <div className="space-y-6">
                    {programmers.data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="mb-4 text-6xl">👨‍💻</div>
                            <p className="mb-2 text-lg text-slate-500">No programmers found</p>
                            <p className="text-sm text-slate-400">
                                {Object.values(filters).some(Boolean)
                                    ? 'Try adjusting your filters to see more programmers.'
                                    : 'There are no programmers available at the moment.'}
                            </p>
                        </div>
                    )}

                    {/* 3 programmers per row grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {programmers.data.map((programmer) => (
                            <ProgrammerCard key={programmer.username} programmer={programmer} />
                        ))}
                    </div>
                </div>

                {programmers.data.length > 0 && programmers.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={programmers.current_page} totalPages={programmers.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}

function ProgrammerCard({ programmer }: ProgrammerCardProps) {
    return (
        <Link href={`/programmers/${programmer.username}`} className="block">
            <Card className="group relative overflow-hidden border-slate-200 bg-white transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>

                <CardContent className="relative z-10 p-4">
                    <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition-all group-hover:ring-blue-300 dark:bg-slate-800 dark:ring-slate-700 dark:group-hover:ring-blue-600">
                                {programmer.avatar ? (
                                    <img src={programmer.avatar} alt={`${programmer.name}'s profile`} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                            {/* Name and Username */}
                            <div className="mb-2">
                                <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                                    {programmer.name}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Code className="h-3 w-3" />
                                    <span className="truncate">@{programmer.username}</span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="mb-2 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                {programmer.student_id && (
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3 text-slate-400" />
                                        <span className="truncate">{programmer.student_id}</span>
                                    </div>
                                )}

                                {programmer.department && (
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3 text-slate-400" />
                                        <span className="truncate">{programmer.department}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-500 dark:text-slate-400">Max CF Rating</div>
                                <div className="flex items-center gap-1">
                                    {programmer.max_cf_rating && programmer.max_cf_rating > 0 ? (
                                        <>
                                            <Trophy className="h-3 w-3 text-yellow-500" />
                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {programmer.max_cf_rating.toLocaleString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">N/A</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function ProgrammersFilters({ filters }: ProgrammersFiltersProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const hasActiveFilters = !!filters.search;

    const createQueryString = useCallback((name: string, value: string | null) => {
        const url = new URL(window.location.href);
        if (value === null) {
            url.searchParams.delete(name);
        } else {
            url.searchParams.set(name, value);
        }
        url.searchParams.delete('page'); // Reset to first page when filtering
        return url.toString();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const newUrl = createQueryString('search', searchQuery || null);
        router.visit(newUrl, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        setSearchQuery(filters.search || '');
    }, [filters.search]);

    const clearAllFilters = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('page');
        router.visit(url.toString(), { preserveState: true, preserveScroll: true });
        setSearchQuery('');
    };

    return (
        <div>
            <Card className="mb-4 border-slate-200 dark:border-slate-700">
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="w-full md:flex-1">
                                <form onSubmit={handleSearch} className="relative">
                                    <Input
                                        placeholder="Search programmers by name, username, student ID, department..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pr-10"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <SearchIcon className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Filter className="mr-1 h-3 w-3" />
                                Filters:
                            </span>

                            {filters.search && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    {`"${filters.search}"`}
                                </Badge>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="h-7 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            title="Clear all filters"
                        >
                            <X className="mr-1 h-3 w-3" />
                            Clear all
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
