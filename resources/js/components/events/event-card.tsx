import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { isAfter, isWithinInterval } from 'date-fns';
import { ArrowUpRight, CalendarDays, Clock, Users } from 'lucide-react';

export type EventListItem = {
    id: number;
    title: string;
    starting_at: string;
    ending_at: string;
    participation_scope: string;
    type: string;
    attendees_count?: number;
};

export function formatDateRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();

    const dateFmt = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
    const timeFmt = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (sameDay) {
        return `${dateFmt.format(start)} • ${timeFmt.format(start)} - ${timeFmt.format(end)}`;
    }
    return `${dateFmt.format(start)} ${timeFmt.format(start)} - ${dateFmt.format(end)} ${dateFmt.format(end)}`;
}

export function humanizeType(v?: string) {
    switch (v) {
        case 'contest':
            return 'Contest';
        case 'class':
            return 'Class';
        case 'other':
            return 'Other';
        default:
            return v || '';
    }
}

export function humanizeScope(v?: string) {
    switch (v) {
        case 'open_for_all':
            return 'Open for All';
        case 'only_girls':
            return 'Only Girls';
        case 'junior_programmers':
            return 'Junior Programmers';
        case 'selected_persons':
            return 'Selected Persons';
        default:
            return v || '';
    }
}

type Props = {
    event: EventListItem;
};

export function EventCard({ event }: Props) {
    // Compute time-based status (evaluated at render time)
    const now = new Date();
    const start = new Date(event.starting_at);
    const end = new Date(event.ending_at);
    const isUpcoming = isAfter(start, now);
    const isRunning = isWithinInterval(now, { start, end });

    const durationInMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    const formatDuration = () => `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;

    const formatEventStatus = (futureDate: Date, reference: Date): string => {
        const diffInMinutes = Math.floor((futureDate.getTime() - reference.getTime()) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays > 0) return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
        if (diffInHours > 0) return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
        if (diffInMinutes > 0) return `in ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
        return 'Starting soon';
    };

    const scopeConfig = (() => {
        switch (event.participation_scope) {
            case 'open_for_all':
                return { icon: '👥', label: 'Open for All' } as const;
            case 'only_girls':
                return { icon: '👩', label: 'Girls Only' } as const;
            case 'junior_programmers':
                return { icon: '🌱', label: 'Junior Programmers' } as const;
            case 'selected_persons':
                return { icon: '✨', label: 'Selected Persons' } as const;
            default:
                return { icon: '👥', label: humanizeScope(event.participation_scope) } as const;
        }
    })();

    const progress = isRunning ? Math.min(100, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100) : 0;

    const getEventTypeBadgeStyle = () => {
        switch (event.type) {
            case 'contest':
                return 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white border-none shadow-sm';
            case 'class':
                return 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white border-none shadow-sm';
            default:
                return 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 text-white border-none shadow-sm';
        }
    };

    const StatusBadge = () => {
        if (isRunning)
            return (
                <Badge
                    variant="outline"
                    className="border-blue-300/70 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 shadow-sm dark:border-blue-700/70 dark:text-blue-300"
                >
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                        Happening Now
                    </span>
                </Badge>
            );
        if (isUpcoming)
            return (
                <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-green-700 dark:border-green-800/30 dark:bg-green-900/20 dark:text-green-400"
                >
                    {formatEventStatus(start, now)}
                </Badge>
            );
        return (
            <Badge
                variant="secondary"
                className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
                Ended
            </Badge>
        );
    };

    return (
        <Link href={`/events/${event.id}`} className="block">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-slate-50 opacity-50 dark:from-slate-800 dark:to-slate-900"></div>
                <div className="absolute -right-10 -bottom-10 -z-10 h-24 w-24 rounded-full bg-blue-100/40 dark:bg-blue-900/20"></div>

                <div className="relative z-10 p-5">
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600 sm:text-lg dark:text-white dark:group-hover:text-blue-400">
                                {event.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(start)}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>
                                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(start)}
                                        {' - '}
                                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(end)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="sm:self-start">
                            <StatusBadge />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="default" className={`${getEventTypeBadgeStyle()} capitalize`}>
                            {event.type === 'class' && '📚 '}
                            {event.type === 'contest' && '🏆 '}
                            {event.type === 'other' && '📋 '}
                            {humanizeType(event.type).toLowerCase()}
                        </Badge>

                        <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                            {scopeConfig.icon} {scopeConfig.label}
                        </Badge>

                        <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                            ⏱️ {formatDuration()}
                        </Badge>
                    </div>

                    {typeof event.attendees_count === 'number' && (
                        <div className="mt-4 flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Users className="mr-1.5 h-4 w-4 text-blue-500" />
                            <span className="flex items-center gap-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{event.attendees_count}</span>
                                {event.attendees_count === 1 ? 'attendee' : 'attendees'}
                            </span>
                        </div>
                    )}

                    {isRunning && (
                        <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                                <span>{Math.round(progress)}% complete</span>
                                <span>Time remaining: {formatEventStatus(end, now)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="absolute right-4 bottom-4 flex h-8 w-8 transform items-center justify-center rounded-full bg-blue-100 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 dark:bg-blue-900/50">
                        <ArrowUpRight className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
