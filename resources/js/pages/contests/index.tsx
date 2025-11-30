import { ContestCard } from '@/components/contests/contest-card';
import { ContestFilters } from '@/components/contests/contest-filters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import type { Contest, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';

type ContestsPageProps = {
    contests: PaginatedData<Contest>;
    filters: {
        search?: string;
        contest_type?: string;
    };
};

export default function ContestsPage({ contests, filters }: ContestsPageProps) {
    return (
        <MainLayout>
            <Head title="Contests" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Explore our participation in competitive programming contests</p>
                </div>

                <div className="mb-6">
                    <ContestFilters filters={filters} />
                </div>

                {/* Contests Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {contests.data.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                            <div className="mb-4 text-6xl">🏆</div>
                            <p className="mb-2 text-lg text-slate-500">No contests found</p>
                            <p className="text-sm text-slate-400">
                                {Object.values(filters).some(Boolean)
                                    ? 'Try adjusting your filters to see more contests.'
                                    : 'There are no contests available at the moment.'}
                            </p>
                        </div>
                    )}
                    {contests.data.map((contest) => (
                        <ContestCard key={contest.id} contest={contest} />
                    ))}
                </div>

                {/* Pagination */}
                {contests.data.length > 0 && contests.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={contests.current_page} totalPages={contests.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
