import { InternalContestCard } from '@/components/internal-contests/internal-contest-card';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import type { InternalContest, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';

type Props = {
    contests: PaginatedData<InternalContest>;
    filters: {
        search?: string;
    };
};

export default function InternalContestsPage({ contests, filters }: Props) {
    return (
        <MainLayout>
            <Head title="Internal Contests" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Internal Contests</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Participate in our internal contests to sharpen your skills</p>
                </div>

                {/* Contests Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {contests.data.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                            <div className="mb-4 text-6xl">🏆</div>
                            <p className="mb-2 text-lg text-slate-500">No internal contests found</p>
                        </div>
                    )}
                    {contests.data.map((contest) => (
                        <InternalContestCard key={contest.id} contest={contest} />
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
