import { Badge } from '@/components/ui/badge';
import type { Contest } from '@/types';
import { Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Trophy, Users } from 'lucide-react';

type Props = {
    contest: Contest;
};

function formatDate(dateString: string | null) {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function getContestTypeBadgeStyle(type?: string) {
    switch (type) {
        case 'icpc_regional':
            return 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white border-none shadow-sm';
        case 'icpc_asia_west':
            return 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-500 text-white border-none shadow-sm';
        case 'iupc':
            return 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white border-none shadow-sm';
        default:
            return 'bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 text-white border-none shadow-sm';
    }
}

function humanizeContestType(type?: string) {
    switch (type) {
        case 'icpc_regional':
            return 'ICPC Regional';
        case 'icpc_asia_west':
            return 'ICPC Asia West';
        case 'iupc':
            return 'IUPC';
        case 'other':
            return 'Other';
        default:
            return type || 'Contest';
    }
}

export function ContestCard({ contest }: Props) {
    return (
        <Link href={`/contests/${contest.id}`} className="block">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-slate-50 opacity-50 dark:from-slate-800 dark:to-slate-900"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                {contest.name}
                            </h3>
                            <Badge className={getContestTypeBadgeStyle(contest.contest_type)}>
                                <Trophy className="mr-1 h-3 w-3" />
                                {humanizeContestType(contest.contest_type)}
                            </Badge>
                        </div>
                    </div>

                    {/* Description */}
                    {contest.description && <p className="mb-4 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{contest.description}</p>}

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                            <span>{formatDate(contest.date)}</span>
                        </div>

                        {contest.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>{contest.location}</span>
                            </div>
                        )}

                        {contest.teams_count !== undefined && contest.teams_count > 0 && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>
                                    {contest.teams_count} {contest.teams_count === 1 ? 'Team' : 'Teams'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
