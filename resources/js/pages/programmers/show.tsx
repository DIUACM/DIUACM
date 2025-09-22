import { CopyButton } from '@/components/programmers/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, GraduationCap, MapPin, Target, Trophy, Users } from 'lucide-react';

type ContestMember = {
    name: string;
    username: string;
    student_id: string;
    profile_picture: string;
};

type Contest = {
    id: number;
    name: string;
    date: string | null;
    team_name: string;
    rank: number | null;
    solve_count: number | null;
    members: ContestMember[];
};

type RanklistItem = {
    keyword: string;
    user_position: number | null;
    user_score: number;
    total_users: number;
    events_count: number;
};

type TrackerPerformance = {
    slug: string;
    title: string;
    ranklists: RanklistItem[];
};

type Programmer = {
    id: number;
    name: string;
    username: string;
    student_id: string;
    department: string;
    max_cf_rating: number | null;
    codeforces_handle: string | null;
    atcoder_handle: string | null;
    vjudge_handle: string | null;
    profile_picture: string;
    contests: Contest[];
    tracker_performance: TrackerPerformance[];
};

type ProgrammerDetailsPageProps = {
    programmer: Programmer;
};

function formatContestDate(iso: string) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

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

export default function ProgrammerDetailsPage({ programmer }: ProgrammerDetailsPageProps) {
    const initials = programmer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <MainLayout>
            <Head title={`${programmer.name} - Programmer Profile`} />

            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                        {/* Profile Picture */}
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 sm:h-32 sm:w-32 dark:bg-slate-800 dark:ring-slate-700">
                            {programmer.profile_picture ? (
                                <img src={programmer.profile_picture} alt={`${programmer.name}'s profile`} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-semibold text-white sm:text-2xl">
                                    {initials}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="mb-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{programmer.name}</h1>
                            <p className="mb-3 text-lg text-slate-600 dark:text-slate-300">@{programmer.username}</p>

                            {typeof programmer.max_cf_rating === 'number' && programmer.max_cf_rating > 0 && (
                                <div className="mb-4">
                                    <Badge className={`${getRatingColor(programmer.max_cf_rating)} px-3 py-1 text-sm text-white`}>
                                        <Trophy className="mr-1 h-4 w-4" />
                                        {programmer.max_cf_rating} • {getRatingTitle(programmer.max_cf_rating)}
                                    </Badge>
                                </div>
                            )}

                            <div className="mb-4 flex flex-wrap justify-center gap-4 text-sm text-slate-600 sm:justify-start dark:text-slate-300">
                                {programmer.student_id && (
                                    <div className="flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>{programmer.student_id}</span>
                                    </div>
                                )}
                                {programmer.department && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{programmer.department}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                                {programmer.codeforces_handle && (
                                    <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm dark:bg-blue-900/20">
                                        <a
                                            href={`https://codeforces.com/profile/${programmer.codeforces_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            CF: {programmer.codeforces_handle}
                                        </a>
                                        <CopyButton
                                            text={programmer.codeforces_handle}
                                            platform="Codeforces"
                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        />
                                    </div>
                                )}

                                {programmer.atcoder_handle && (
                                    <div className="flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1 text-sm dark:bg-orange-900/20">
                                        <a
                                            href={`https://atcoder.jp/users/${programmer.atcoder_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-600 hover:underline dark:text-orange-400"
                                        >
                                            AC: {programmer.atcoder_handle}
                                        </a>
                                        <CopyButton
                                            text={programmer.atcoder_handle}
                                            platform="AtCoder"
                                            className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                        />
                                    </div>
                                )}

                                {programmer.vjudge_handle && (
                                    <div className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1 text-sm dark:bg-green-900/20">
                                        <a
                                            href={`https://vjudge.net/user/${programmer.vjudge_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:underline dark:text-green-400"
                                        >
                                            VJ: {programmer.vjudge_handle}
                                        </a>
                                        <CopyButton
                                            text={programmer.vjudge_handle}
                                            platform="VJudge"
                                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracker Performance */}
                {Array.isArray(programmer.tracker_performance) && programmer.tracker_performance.length > 0 && (
                    <div className="mb-8">
                        <h2 className="mb-6 flex items-center text-xl font-semibold text-slate-900 dark:text-white">
                            <Target className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Tracker Performance ({programmer.tracker_performance.length})
                        </h2>

                        <div className="space-y-6">
                            {programmer.tracker_performance.map((tracker) => (
                                <Card key={tracker.slug} className="transition-shadow hover:shadow-md">
                                    <CardContent>
                                        <div className="mb-4">
                                            <h3 className="text-lg font-medium">{tracker.title}</h3>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {tracker.ranklists.map((rankList) => (
                                                <Link
                                                    key={rankList.keyword}
                                                    href={`/trackers/${tracker.slug}?keyword=${encodeURIComponent(rankList.keyword)}`}
                                                    className="block rounded-lg border bg-slate-50/50 p-4 transition-colors hover:bg-slate-100/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h4 className="font-medium">{rankList.keyword}</h4>
                                                        {rankList.user_position && (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                                            >
                                                                #{rankList.user_position}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                <span>Total Users</span>
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {rankList.total_users}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>Events</span>
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {rankList.events_count}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Trophy className="h-4 w-4 text-amber-500" />
                                                                <span>Score</span>
                                                            </div>
                                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                                {rankList.user_score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contest Participations */}
                {Array.isArray(programmer.contests) && programmer.contests.length > 0 && (
                    <div>
                        <h2 className="mb-6 flex items-center text-xl font-semibold text-slate-900 dark:text-white">
                            <Trophy className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Contest Participations ({programmer.contests.length})
                        </h2>

                        <div className="space-y-4">
                            {programmer.contests.map((contest) => (
                                <Card key={contest.id}>
                                    <CardContent>
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">{contest.name}</h3>
                                                {contest.date && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{formatContestDate(contest.date)}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                    {contest.team_name}
                                                </Badge>
                                                {contest.rank && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                                    >
                                                        Rank #{contest.rank}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Team Members ({contest.members.length})
                                            </h4>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                                {contest.members.map((member) => (
                                                    <Link
                                                        key={member.username}
                                                        href={`/programmers/${member.username}`}
                                                        className="flex items-center gap-3 rounded-lg bg-slate-50/50 p-2 transition-colors hover:bg-slate-100/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                                                    >
                                                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                                            {member.profile_picture ? (
                                                                <img
                                                                    src={member.profile_picture}
                                                                    alt={member.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-xs text-white">
                                                                    {member.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                                                                {member.name}
                                                            </p>
                                                            {member.student_id && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{member.student_id}</p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>

                                            {contest.solve_count !== null && (
                                                <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                                    <Trophy className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {contest.solve_count} problems solved
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <Button asChild variant="ghost" className="px-2">
                        <Link href="/programmers">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Programmers
                        </Link>
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
