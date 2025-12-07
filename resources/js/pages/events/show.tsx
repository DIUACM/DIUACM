import { AttendanceButton } from '@/components/events/attendance-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/layouts/main-layout';
import events from '@/routes/events';
import type { Auth, EventDetails } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { isAfter, isWithinInterval } from 'date-fns';
import { ArrowLeft, CalendarDays, Clock, MapPin, Medal, TrendingUp, Users } from 'lucide-react';

type Props = {
    event: EventDetails;
    auth?: Auth;
};

export default function EventDetailsPage({ event, auth }: Props) {
    const now = new Date();
    const start = new Date(event.starting_at);
    const end = new Date(event.ending_at);
    const isUpcoming = isAfter(start, now);
    const isRunning = isWithinInterval(now, { start, end });

    const attendanceWindowStart = Number.isNaN(start.getTime()) ? null : new Date(start.getTime() - 15 * 60 * 1000);
    const attendanceWindowEnd = Number.isNaN(end.getTime()) ? null : new Date(end.getTime() + 20 * 60 * 1000);
    const attendanceWindowEnabled = Boolean(
        event.open_for_attendance &&
            attendanceWindowStart &&
            attendanceWindowEnd &&
            isWithinInterval(now, {
                start: attendanceWindowStart,
                end: attendanceWindowEnd,
            }),
    );
    let attendanceState: 'before_window' | 'during_window' | 'after_window' | undefined;
    if (attendanceWindowStart && attendanceWindowEnd) {
        if (now < attendanceWindowStart) {
            attendanceState = 'before_window';
        } else if (now > attendanceWindowEnd) {
            attendanceState = 'after_window';
        } else {
            attendanceState = 'during_window';
        }
    }
    const userAlreadyAttended = Boolean(auth?.user && event.attendance?.some((attendee) => attendee.username === auth.user.username));
    const attendanceWindowStartIso = attendanceWindowStart?.toISOString() ?? null;
    const attendanceWindowEndIso = attendanceWindowEnd?.toISOString() ?? null;

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
                return {
                    icon: '👥',
                    label: event.participation_scope,
                } as const;
        }
    })();

    const progress = isRunning ? Math.min(100, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100) : 0;

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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Determine which tabs to show
    const showAttendance = event.open_for_attendance && event.attendance && event.attendance.length > 0;
    const showPerformance = event.type === 'contest' && event.performance && event.performance.length > 0;
    const shouldShowTabs = showAttendance && showPerformance;

    const defaultTab = showAttendance ? 'attendance' : 'performance';

    return (
        <MainLayout>
            <Head title={event.title} />

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
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <h1 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{event.title}</h1>

                            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    <span>
                                        {new Intl.DateTimeFormat('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }).format(start)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>
                                        {new Intl.DateTimeFormat('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        }).format(start)}
                                        {' - '}
                                        {new Intl.DateTimeFormat('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        }).format(end)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{formatDuration()}</span>
                                </div>
                            </div>

                            {event.description && <p className="mb-4 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{event.description}</p>}
                        </div>

                        <div className="sm:self-start">
                            <StatusBadge />
                        </div>
                    </div>

                    {/* Event Information - Badges */}
                    <div className="mb-4 flex flex-wrap gap-3">
                        <Badge variant="default" className={`${getEventTypeBadgeStyle()} capitalize`}>
                            {event.type === 'class' && '📚 '}
                            {event.type === 'contest' && '🏆 '}
                            {event.type === 'other' && '📋 '}
                            {event.type}
                        </Badge>

                        <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                            {scopeConfig.icon} {scopeConfig.label}
                        </Badge>

                        {showAttendance && event.attendance && (
                            <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                                <Users className="mr-1 h-3 w-3" />
                                {event.attendance.length} {event.attendance.length === 1 ? 'attendee' : 'attendees'}
                            </Badge>
                        )}
                    </div>

                    {/* Ranklists */}
                    {event.ranklists && event.ranklists.length > 0 && (
                        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Rated for {event.ranklists.length} {event.ranklists.length === 1 ? 'Ranklist' : 'Ranklists'}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {event.ranklists.map((ranklist, index) => (
                                    <Link
                                        key={index}
                                        href={`/trackers/${ranklist.tracker_slug}?keyword=${ranklist.keyword}`}
                                        className="group rounded-lg border border-blue-200 bg-white p-3 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-blue-800/30 dark:bg-slate-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {ranklist.tracker_title}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">({ranklist.keyword})</div>
                                                </div>
                                                <Badge className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                                                    ×{ranklist.weight}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                <span>View Ranklist</span>
                                                <svg
                                                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {event.event_link && (
                            <a href={event.event_link} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    className="border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-400"
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Event Link
                                </Button>
                            </a>
                        )}

                        {/* Attendance Button */}
                        {event.open_for_attendance && (
                            <AttendanceButton
                                eventId={event.id}
                                openForAttendance={event.open_for_attendance}
                                userAlreadyAttended={userAlreadyAttended}
                                attendanceWindowEnabled={attendanceWindowEnabled}
                                attendanceWindowStart={attendanceWindowStartIso}
                                attendanceWindowEnd={attendanceWindowEndIso}
                                isAuthenticated={!!auth?.user}
                                state={attendanceState}
                            />
                        )}
                    </div>

                    {isRunning && (
                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
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
                </div>

                {/* Event Gallery */}
                {event.images && event.images.length > 0 && (
                    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Event Gallery</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {event.images.map((image, index) => (
                                <div key={index} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                    <img src={image.thumbnail} alt={`Event image ${index + 1}`} className="h-64 w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content - Tabs or individual sections */}
                {shouldShowTabs ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <Tabs defaultValue={defaultTab} className="w-full">
                                <TabsList className="mb-6 w-full bg-slate-100 p-1 sm:w-fit dark:bg-slate-800">
                                    {showAttendance && event.attendance && (
                                        <TabsTrigger value="attendance" className="flex items-center gap-2 rounded-lg">
                                            <Users className="h-4 w-4" />
                                            <span>Attendees ({event.attendance.length})</span>
                                        </TabsTrigger>
                                    )}
                                    {showPerformance && event.performance && (
                                        <TabsTrigger value="performance" className="flex items-center gap-2 rounded-lg">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Performance ({event.performance.length})</span>
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {showAttendance && event.attendance && (
                                    <TabsContent value="attendance" className="mt-4 p-0">
                                        <div className="space-y-4">
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">Name</TableHead>
                                                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">
                                                                Student ID
                                                            </TableHead>
                                                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">
                                                                Department
                                                            </TableHead>
                                                            <TableHead className="text-right font-medium text-slate-700 dark:text-slate-300">
                                                                Timestamp
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {event.attendance.map((attendee, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                                                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                                                                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                                {getInitials(attendee.name)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                                {attendee.name}
                                                                            </div>
                                                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                                @{attendee.username}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                                    {attendee.student_id || '—'}
                                                                </TableCell>
                                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                                    {attendee.department || '—'}
                                                                </TableCell>
                                                                <TableCell className="text-right text-slate-500 dark:text-slate-400">
                                                                    {formatTimestamp(attendee.attended_at)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}

                                {showPerformance && event.performance && (
                                    <TabsContent value="performance" className="mt-4 p-0">
                                        <div className="space-y-4">
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">Rank</TableHead>
                                                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">
                                                                Participant
                                                            </TableHead>
                                                            <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">
                                                                Solves
                                                            </TableHead>
                                                            <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">
                                                                Upsolves
                                                            </TableHead>
                                                            <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">
                                                                Total
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {event.performance.map((user, index) => (
                                                            <TableRow key={index} className={index < 3 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
                                                                        {index === 1 && <Medal className="h-5 w-5 text-slate-400" />}
                                                                        {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                                                                        {index > 2 && <span className="pl-1">#{index + 1}</span>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                                                            <AvatarImage src={user.avatar} alt={user.name} />
                                                                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                                {getInitials(user.name)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                                {user.name}
                                                                            </div>
                                                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                                @{user.username}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                                                        {user.solve_count}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
                                                                    >
                                                                        {user.upsolve_count}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center font-medium text-slate-900 dark:text-white">
                                                                    {user.solve_count + user.upsolve_count}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    </div>
                ) : showAttendance && event.attendance ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Attendees ({event.attendance.length})
                            </h2>
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                <TableHead className="font-medium text-slate-700 dark:text-slate-300">Name</TableHead>
                                                <TableHead className="font-medium text-slate-700 dark:text-slate-300">Student ID</TableHead>
                                                <TableHead className="font-medium text-slate-700 dark:text-slate-300">Department</TableHead>
                                                <TableHead className="text-right font-medium text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {event.attendance.map((attendee, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                                                <AvatarImage src={attendee.avatar} alt={attendee.name} />
                                                                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                    {getInitials(attendee.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white">{attendee.name}</div>
                                                                <div className="text-sm text-slate-500 dark:text-slate-400">@{attendee.username}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{attendee.student_id || '—'}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{attendee.department || '—'}</TableCell>
                                                    <TableCell className="text-right text-slate-500 dark:text-slate-400">
                                                        {formatTimestamp(attendee.attended_at)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : showPerformance && event.performance ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Performance ({event.performance.length})
                            </h2>
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                <TableHead className="font-medium text-slate-700 dark:text-slate-300">Rank</TableHead>
                                                <TableHead className="font-medium text-slate-700 dark:text-slate-300">Participant</TableHead>
                                                <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">Solves</TableHead>
                                                <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">Upsolves</TableHead>
                                                <TableHead className="text-center font-medium text-slate-700 dark:text-slate-300">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {event.performance.map((user, index) => (
                                                <TableRow key={index} className={index < 3 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
                                                            {index === 1 && <Medal className="h-5 w-5 text-slate-400" />}
                                                            {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                                                            {index > 2 && <span className="pl-1">#{index + 1}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                    {getInitials(user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                                                                <div className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                                            {user.solve_count}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
                                                        >
                                                            {user.upsolve_count}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium text-slate-900 dark:text-white">
                                                        {user.solve_count + user.upsolve_count}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 text-6xl">📊</div>
                        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">No additional data available</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {!event.open_for_attendance &&
                                event.type !== 'contest' &&
                                "This event doesn't have attendance tracking or performance data."}
                            {!event.open_for_attendance && event.type === 'contest' && 'Attendance tracking is not enabled for this contest.'}
                            {event.open_for_attendance &&
                                event.type !== 'contest' &&
                                (!event.attendance || event.attendance.length === 0) &&
                                'No one has attended this event yet.'}
                            {event.type === 'contest' &&
                                (!event.performance || event.performance.length === 0) &&
                                'No performance data is available for this contest yet.'}
                        </p>
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
