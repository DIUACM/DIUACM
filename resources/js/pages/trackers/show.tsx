import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MainLayout from '@/layouts/main-layout';
import trackers from '@/routes/trackers';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Download, FileText, Info, Shield, TrendingUp, Users } from 'lucide-react';

type EventStat = {
    solve_count: number;
    upsolve_count: number;
    participation: boolean;
} | null;

type Event = {
    id: number;
    title: string;
    starting_at: string;
    strict_attendance?: boolean;
};

type User = {
    id: number;
    name: string;
    username: string;
    profile_picture: string;
    score: number;
    event_stats: Record<number, EventStat>;
};

type RankList = {
    id: number;
    keyword: string;
    consider_strict_attendance: boolean;
    events: Event[];
    users: User[];
};

type Tracker = {
    id: number;
    title: string;
    slug: string;
};

type PageProps = {
    tracker: Tracker;
    selectedRankList: RankList | null;
    availableRankLists: Array<{
        id: number;
        keyword: string;
    }>;
};

function StatCell({ stat }: { stat: EventStat }) {
    if (stat === null) {
        return (
            <div className="px-4 py-3">
                <Badge variant="secondary" className="text-xs">
                    No data
                </Badge>
            </div>
        );
    }

    const { solve_count, upsolve_count, participation } = stat;

    return (
        <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
                {!participation ? (
                    <>
                        <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                        >
                            Absent
                        </Badge>
                        {upsolve_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {upsolve_count} Upsolve{upsolve_count !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </>
                ) : (
                    <>
                        <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                        >
                            {solve_count} Solve{solve_count !== 1 ? 's' : ''}
                        </Badge>
                        {upsolve_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {upsolve_count} Upsolve{upsolve_count !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function TrackersShow() {
    const { props } = usePage<PageProps>();
    const { tracker, selectedRankList, availableRankLists } = props;

    if (!selectedRankList) {
        return (
            <MainLayout>
                <Head title={tracker.title} />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">{tracker.title}</h1>
                        <p className="text-slate-600 dark:text-slate-300">No rank list available</p>
                        <Link
                            href={trackers.index.url()}
                            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Trackers
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const events = selectedRankList.events;
    const users = selectedRankList.users;

    return (
        <MainLayout>
            <Head title={`${tracker.title} - ${selectedRankList.keyword}`} />
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="text-center lg:text-left">
                        <Link
                            href={trackers.index.url()}
                            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Trackers
                        </Link>
                        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{tracker.title}</h1>
                    </div>

                    {/* Ranklist Navigation and Stats */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex flex-col gap-4">
                                {/* Ranklist Navigation */}
                                {availableRankLists.length > 1 && (
                                    <div>
                                        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Available Rankings</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableRankLists.map((rankList) => {
                                                const isActive = rankList.id === selectedRankList.id;
                                                const href = `/trackers/${tracker.slug}?keyword=${rankList.keyword}`;

                                                return (
                                                    <Link key={rankList.id} href={href}>
                                                        <Button
                                                            variant={isActive ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={isActive ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                                        >
                                                            {rankList.keyword}
                                                        </Button>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="secondary" className="gap-1.5">
                                        <Users className="h-4 w-4" />
                                        <span className="hidden sm:inline">Users:</span>
                                        {users.length}
                                    </Badge>

                                    <Badge variant="secondary" className="gap-1.5">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="hidden sm:inline">Events:</span>
                                        {events.length}
                                    </Badge>

                                    {selectedRankList.consider_strict_attendance && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                        >
                                            <Shield className="h-4 w-4" />
                                            <span className="hidden sm:inline">Strict Attendance</span>
                                        </Badge>
                                    )}
                                </div>

                                {/* Export button */}
                                <div className="flex items-center gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                <Download className="h-4 w-4" />
                                                Export
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={trackers.export.url(tracker.slug, {
                                                        query: { keyword: selectedRankList.keyword, format: 'json' },
                                                    })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Download as JSON
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={trackers.export.url(tracker.slug, {
                                                        query: { keyword: selectedRankList.keyword, format: 'csv' },
                                                    })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Download as CSV
                                                </a>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ranking Table */}
                    <div className="space-y-6">
                        <div className="mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Rankings</h2>
                        </div>

                        {users.length === 0 || events.length === 0 ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
                                <div className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-500">
                                    <BarChart3 className="h-full w-full" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-slate-700 dark:text-slate-300">No data available</h3>
                                <p className="text-slate-600 dark:text-slate-400">This ranklist doesn&apos;t have any data to display yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Table */}
                                <div className="inline-block min-w-full align-middle">
                                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                            {/* Table Header */}
                                            <thead className="bg-slate-50 dark:bg-slate-800">
                                                <tr>
                                                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                                                        Rank
                                                    </th>
                                                    <th className="sticky left-16 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                                                        User
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                        Score
                                                    </th>
                                                    {events.map((event) => (
                                                        <th
                                                            key={event.id}
                                                            className="min-w-48 px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
                                                        >
                                                            <div className="space-y-1">
                                                                <Link
                                                                    href={`/events/${event.id}`}
                                                                    className="block truncate text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                                    title={event.title}
                                                                >
                                                                    {event.title.length > 30 ? `${event.title.substring(0, 30)}...` : event.title}
                                                                </Link>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {new Date(event.starting_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                        })}
                                                                    </span>
                                                                    {selectedRankList.consider_strict_attendance && event.strict_attendance && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="border-orange-200 bg-orange-50 text-xs text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                                                            title="Strict attendance enforced"
                                                                        >
                                                                            <Shield className="mr-1 h-3 w-3" />
                                                                            SA
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            {/* Table Body */}
                                            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                                                {users.map((user, index) => (
                                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        {/* Rank */}
                                                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/50">
                                                            {index + 1}
                                                        </td>

                                                        {/* User */}
                                                        <td className="sticky left-16 z-10 bg-white px-4 py-3 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50">
                                                            <Link href={`/programmers/${user.username}`} className="group flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={user.profile_picture || ''} alt={user.name} />
                                                                    <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                                                    {user.name.length > 20 ? `${user.name.substring(0, 20)}...` : user.name}
                                                                </span>
                                                            </Link>
                                                        </td>

                                                        {/* Score */}
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                                                            {typeof user.score === 'number' ? user.score.toFixed(1) : user.score}
                                                        </td>

                                                        {/* Event Scores */}
                                                        {events.map((event) => (
                                                            <td key={event.id}>
                                                                <StatCell stat={user.event_stats[event.id] || null} />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Scoring Information */}
                                <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                                    <div className="flex items-start gap-3">
                                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <div className="text-sm">
                                            <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">Scoring Information</h4>
                                            <div className="space-y-2 text-slate-600 dark:text-slate-400">
                                                <p>• Scores are calculated based on solve performance and upsolve counts</p>
                                                <p>• Rankings are sorted by total score in descending order</p>
                                                {selectedRankList.consider_strict_attendance && (
                                                    <p>
                                                        • <span className="font-medium text-orange-600 dark:text-orange-400">Strict Attendance:</span>{' '}
                                                        Events marked with &quot;SA&quot; require attendance. Users without attendance will have their
                                                        solves counted as upsolves only.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
