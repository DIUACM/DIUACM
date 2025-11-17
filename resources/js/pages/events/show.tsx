
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main-layout';
import events from '@/routes/events';
import type { EventDetails } from '@/types';
import { Link } from '@inertiajs/react';
import { isAfter, isWithinInterval } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    Clock,
    ExternalLink,
    Trophy,
    Users,
} from 'lucide-react';

type Props = {
    event: EventDetails;
};

export default function EventDetailsPage({ event }: Props) {
    const now = new Date();
    const start = new Date(event.starting_at);
    const end = new Date(event.ending_at);
    const isUpcoming = isAfter(start, now);
    const isRunning = isWithinInterval(now, { start, end });
    const isEnded = isAfter(now, end);

    const durationInMinutes = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    );
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    const formatDuration = () =>
        `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;

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

    const getScopeLabel = () => {
        switch (event.participation_scope) {
            case 'open_for_all':
                return 'Open for All';
            case 'only_girls':
                return 'Girls Only';
            case 'junior_programmers':
                return 'Junior Programmers';
            case 'selected_persons':
                return 'Selected Persons';
            default:
                return event.participation_scope;
        }
    };

    const getScopeIcon = () => {
        switch (event.participation_scope) {
            case 'open_for_all':
                return '👥';
            case 'only_girls':
                return '👩';
            case 'junior_programmers':
                return '🌱';
            case 'selected_persons':
                return '✨';
            default:
                return '👥';
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
                    Upcoming
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
        <MainLayout>
            <section className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href={events.index.url()}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>
                    </Link>
                </div>

                {/* Event Header */}
                <div className="mb-8">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="mb-3 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge />
                                <Badge
                                    variant="default"
                                    className={`${getEventTypeBadgeStyle()} capitalize`}
                                >
                                    {event.type === 'class' && '📚 '}
                                    {event.type === 'contest' && '🏆 '}
                                    {event.type === 'other' && '📋 '}
                                    {event.type}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30"
                                >
                                    {getScopeIcon()} {getScopeLabel()}
                                </Badge>
                            </div>
                        </div>

                        {event.event_link && (
                            <Link href={event.event_link} target="_blank">
                                <Button className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Join Event
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Event Info Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Start Date
                                    </p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {new Intl.DateTimeFormat('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        }).format(start)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Time
                                    </p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {new Intl.DateTimeFormat('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        }).format(start)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Duration
                                    </p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {formatDuration()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        {/* Description */}
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>About This Event</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-slate max-w-none dark:prose-invert">
                                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                        {event.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Event Images */}
                        {event.images && event.images.length > 0 && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle>Event Gallery</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {event.images.map((image, index) => (
                                            <div
                                                key={index}
                                                className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                                            >
                                                <img
                                                    src={image.preview_url}
                                                    alt={`Event image ${index + 1}`}
                                                    className="h-64 w-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Performance Data for Contests */}
                        {event.type === 'contest' &&
                            event.performance &&
                            event.performance.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="h-5 w-5 text-yellow-500" />
                                            Performance Leaderboard
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                                        <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Rank
                                                        </th>
                                                        <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Name
                                                        </th>
                                                        <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Student ID
                                                        </th>
                                                        <th className="pb-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Solves
                                                        </th>
                                                        <th className="pb-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Upsolves
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {event.performance.map(
                                                        (user, index) => (
                                                            <tr
                                                                key={index}
                                                                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                                            >
                                                                <td className="py-3 text-slate-700 dark:text-slate-300">
                                                                    <span
                                                                        className={`font-semibold ${
                                                                            index ===
                                                                            0
                                                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                                                : index ===
                                                                                    1
                                                                                  ? 'text-slate-400 dark:text-slate-500'
                                                                                  : index ===
                                                                                      2
                                                                                    ? 'text-orange-600 dark:text-orange-400'
                                                                                    : ''
                                                                        }`}
                                                                    >
                                                                        #{index + 1}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-slate-900 dark:text-white">
                                                                    {
                                                                        user.name
                                                                    }
                                                                </td>
                                                                <td className="py-3 text-sm text-slate-600 dark:text-slate-400">
                                                                    {
                                                                        user.student_id
                                                                    }
                                                                </td>
                                                                <td className="py-3 text-center">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                                    >
                                                                        {
                                                                            user.solve_count
                                                                        }
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3 text-center">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                                    >
                                                                        {
                                                                            user.upsolve_count
                                                                        }
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Attendance List */}
                        {event.open_for_attendance &&
                            event.attendance &&
                            event.attendance.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Attendees ({event.attendance.length}
                                            )
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {event.attendance.map(
                                                (attendee, index) => (
                                                    <div key={index}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-medium text-slate-900 dark:text-white">
                                                                    {
                                                                        attendee.name
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        attendee.student_id
                                                                    }
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                {new Intl.DateTimeFormat(
                                                                    'en-US',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                    }
                                                                ).format(
                                                                    new Date(
                                                                        attendee.attended_at
                                                                    )
                                                                )}
                                                            </p>
                                                        </div>
                                                        {index <
                                                            (event.attendance
                                                                ?.length ?? 0) -
                                                                1 && (
                                                            <Separator className="mt-3" />
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
