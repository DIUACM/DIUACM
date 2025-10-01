import { ProgrammerCard, ProgrammerListItem } from '@/components/programmers/programmer-card';
import { ProgrammersFilters } from '@/components/programmers/programmers-filters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';

type PaginatedProgrammers = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: ProgrammerListItem[];
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

type ProgrammersPageProps = {
    programmers: PaginatedProgrammers;
    filters: {
        search?: string;
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
                            <ProgrammerCard key={programmer.id} programmer={programmer} />
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
