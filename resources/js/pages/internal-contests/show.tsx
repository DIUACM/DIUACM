import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import type { InternalContestDetails } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock, DollarSign, Users } from 'lucide-react';

type Props = {
    contest: InternalContestDetails;
};

function formatDate(dateString: string | null) {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(date);
}

export default function InternalContestDetailsPage({ contest }: Props) {
    return (
        <MainLayout>
            <Head title={contest.title} />

            <section className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/internal-contests">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Internal Contests
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {contest.banner_image && (
                            <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
                                <img src={contest.banner_image} alt={contest.title} className="h-full w-full object-cover" />
                            </div>
                        )}

                        <div className="mb-8">
                            <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">{contest.title}</h1>
                            <div className="prose max-w-none dark:prose-invert">
                                <p>{contest.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Registration Details</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Registration Deadline</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(contest.registration_deadline)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Contest Starts</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(contest.registration_start_time)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <DollarSign className="mt-0.5 h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Registration Fee</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {contest.registration_fee > 0 ? `৳${contest.registration_fee}` : 'Free'}
                                        </p>
                                    </div>
                                </div>

                                {contest.registration_limit && (
                                    <div className="flex items-start gap-3">
                                        <Users className="mt-0.5 h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Registration Limit</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{contest.registration_limit} Participants</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                {contest.is_registration_open ? (
                                    <Button className="w-full" size="lg">
                                        Register Now
                                    </Button>
                                ) : (
                                    <Button className="w-full" size="lg" disabled>
                                        Registration Closed
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
