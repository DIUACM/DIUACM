import { Badge } from '@/components/ui/badge';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    Copy,
    GraduationCap,
    MapPin,
    Target,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type User = {
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

type Contest = {
    id: number;
    name: string;
    date?: string | null;
};

type TeamMember = {
    id: number;
    user: User;
};

type Team = {
    id: number;
    name: string;
    rank?: number | null;
    solve_count?: number | null;
    members: TeamMember[];
};

type ContestParticipation = {
    contest: Contest;
    team: Team;
};

type RankList = {
    id: number;
    keyword: string;
};

type Tracker = {
    id: number;
    title: string;
    slug: string;
};

type TrackerRankList = {
    rank_list: RankList;
    score: number;
    user_position: number;
    total_users: number;
    event_count: number;
};

type TrackerPerformance = {
    tracker: Tracker;
    rank_lists: TrackerRankList[];
};

type PageProps = {
    programmer: User;
    contest_participations: ContestParticipation[];
    tracker_performances: TrackerPerformance[];
};

function CopyButton({ 
    text, 
    platform, 
    className 
}: { 
    text: string; 
    platform: string; 
    className?: string; 
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(`${platform} handle copied to clipboard!`);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy to clipboard');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1 transition-colors ${className}`}
            title={`Copy ${platform} handle`}
        >
            <Copy className="h-3 w-3" />
        </button>
    );
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

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    }).format(d);
}

export default function ProgrammerShow() {
    const { props } = usePage<PageProps>();
    const { programmer, contest_participations, tracker_performances } = props;

    const initials = programmer.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();

    return (
        <MainLayout title={programmer.name}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Compact Profile Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 rounded-full overflow-hidden">
                            {programmer.image ? (
                                <img
                                    src={programmer.image}
                                    alt={programmer.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-semibold bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                    {initials}
                                </div>
                            )}
                        </div>

                        {/* Name and Basic Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900 dark:text-white">
                                {programmer.name}
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-3">
                                @{programmer.username}
                            </p>

                            {/* Rating Badge */}
                            {programmer.max_cf_rating && programmer.max_cf_rating > -1 && (
                                <div className="mb-4">
                                    <Badge
                                        className={`${getRatingColor(
                                            programmer.max_cf_rating
                                        )} text-white text-sm px-3 py-1`}
                                    >
                                        <Trophy className="w-4 h-4 mr-1" />
                                        {programmer.max_cf_rating} •{' '}
                                        {getRatingTitle(programmer.max_cf_rating)}
                                    </Badge>
                                </div>
                            )}

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
                                {programmer.student_id && (
                                    <div className="flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4" />
                                        <span>{programmer.student_id}</span>
                                    </div>
                                )}
                                {programmer.department && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{programmer.department}</span>
                                    </div>
                                )}
                            </div>

                            {/* Platform Handles with Copy */}
                            <div className="flex flex-wrap gap-2">
                                {programmer.codeforces_handle && (
                                    <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-1 text-sm">
                                        <a
                                            href={`https://codeforces.com/profile/${programmer.codeforces_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
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
                                    <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-1 text-sm">
                                        <a
                                            href={`https://atcoder.jp/users/${programmer.atcoder_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-600 dark:text-orange-400 hover:underline"
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
                                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1 text-sm">
                                        <a
                                            href={`https://vjudge.net/user/${programmer.vjudge_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 dark:text-green-400 hover:underline"
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
                {tracker_performances.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Tracker Performance ({tracker_performances.length})
                        </h2>

                        <div className="space-y-6">
                            {tracker_performances.map((tracker: TrackerPerformance) => (
                                <div
                                    key={tracker.tracker.id}
                                    className="relative bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all overflow-hidden group hover:shadow-lg"
                                >
                                    {/* Ambient light effect */}
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>

                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 opacity-50 -z-10"></div>

                                    {/* Decorative accent element */}
                                    <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-purple-100/40 dark:bg-purple-900/20 -z-10"></div>

                                    <div className="p-5 relative z-10">
                                        {/* Tracker Header */}
                                        <div className="mb-4">
                                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                                {tracker.tracker.title}
                                            </h3>
                                        </div>

                                        {/* Rank Lists */}
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {tracker.rank_lists.map((rankList) => (
                                                <Link
                                                    key={rankList.rank_list.id}
                                                    href={`/trackers/${tracker.tracker.slug}/${rankList.rank_list.keyword}`}
                                                    className="block p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors border border-slate-200/60 dark:border-slate-600/40"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-slate-900 dark:text-white">
                                                            {rankList.rank_list.keyword}
                                                        </h4>
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                                        >
                                                            #{rankList.user_position}
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                <span>Total Users</span>
                                                            </div>
                                                            <span className="font-medium">
                                                                {rankList.total_users}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>Events</span>
                                                            </div>
                                                            <span className="font-medium">
                                                                {rankList.event_count}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Trophy className="w-4 h-4 text-amber-500" />
                                                                <span>Score</span>
                                                            </div>
                                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                                {rankList.score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contest Participations */}
                {contest_participations.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                            Contest Participations ({contest_participations.length})
                        </h2>

                        <div className="space-y-4">
                            {contest_participations.map((participation: ContestParticipation) => (
                                <div
                                    key={`${participation.contest.id}-${participation.team.id}`}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-800"
                                >
                                    {/* Contest Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                                {participation.contest.name}
                                            </h3>
                                            {participation.contest.date && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(participation.contest.date)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                            >
                                                {participation.team.name}
                                            </Badge>
                                            {participation.team.rank && (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                                >
                                                    Rank #{participation.team.rank}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team Members */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                            Team Members ({participation.team.members.length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {participation.team.members.map((member: TeamMember) => (
                                                <Link
                                                    key={member.id}
                                                    href={`/programmers/${member.user.username}`}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden">
                                                        {member.user.image ? (
                                                            <img
                                                                src={member.user.image}
                                                                alt={member.user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                                                {member.user.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                                                            {member.user.name}
                                                        </p>
                                                        {member.user.student_id && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {member.user.student_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Solve Count */}
                                        {participation.team.solve_count !== null && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {participation.team.solve_count} problems solved
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {contest_participations.length === 0 && tracker_performances.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <Trophy className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">
                            No activity found
                        </h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                            This programmer hasn't participated in any contests or trackers yet.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}