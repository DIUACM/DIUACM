import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { registration } from '@/routes/internal-contests';
import type { InternalContestDetails } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock, Users } from 'lucide-react';

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
                        {/* Contest Header */}
                        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{contest.title}</h1>

                            {/* Metadata */}
                            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    <span>Deadline: {formatDate(contest.registration_deadline)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>Starts: {formatDate(contest.registration_start_time)}</span>
                                </div>

                                {contest.registration_limit && (
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span>
                                            {contest.registration_limit} {contest.registration_limit === 1 ? 'Participant' : 'Participants'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Banner Image */}
                            {contest.banner_image && (
                                <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                    <img src={contest.banner_image} alt={contest.title} className="h-full w-full object-cover" />
                                </div>
                            )}

                            {/* Description */}
                            {contest.description && (
                                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                                    <div
                                        className="prose max-w-none prose-slate dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: contest.description }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="sticky top-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
                                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center text-lg font-bold text-blue-500">৳</span>
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

                            <div className="mt-6 hidden lg:block">
                                {contest.is_registration_open ? (
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={registration.url(contest.slug)}>Register Now</Link>
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

                {/* Mobile Fixed Bottom Button */}
                <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden dark:border-slate-700 dark:bg-slate-900">
                    <div className="container mx-auto">
                        {contest.is_registration_open ? (
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                size="lg"
                                asChild
                            >
                                <Link href={registration.url(contest.slug)}>Register Now</Link>
                            </Button>
                        ) : (
                            <Button className="w-full" size="lg" disabled>
                                Registration Closed
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
