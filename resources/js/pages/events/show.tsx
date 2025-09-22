import { AttendanceButton } from '@/components/events/attendance-button';
import { AttendanceTab } from '@/components/events/attendance-tab';
import { PerformanceTab } from '@/components/events/performance-tab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/layouts/main-layout';
import { Head, Link } from '@inertiajs/react';
import { isAfter, isWithinInterval } from 'date-fns';
import { ArrowLeft, CalendarDays, Clock, MapPin, TrendingUp, Users } from 'lucide-react';

type User = {
    id: number;
    name: string;
    username: string;
    student_id: string;
    department: string;
    profile_picture: string;
};

type Attendee = User & {
    attended_at: string;
};

type PerformanceData = {
    user: User;
    solve_count: number;
    upsolve_count: number;
    participation: boolean;
    total_count: number;
};

type AttendanceInfo = {
    user_already_attended: boolean;
    has_password: boolean;
    attendance_window_enabled: boolean;
    attendance_window_start: string | null;
    attendance_window_end: string | null;
    state?: 'before_window' | 'during_window' | 'after_window';
};

type Event = {
    id: number;
    title: string;
    description: string;
    starting_at: string;
    ending_at: string;
    participation_scope: string;
    type: string;
    open_for_attendance: boolean;
    event_link?: string;
};

type EventDetailsPageProps = {
    event: Event;
    attendees?: Attendee[];
    attendees_count?: number;
    performance_data?: PerformanceData[];
    performance_count?: number;
    attendance_info?: AttendanceInfo;
    auth?: {
        user: User;
    };
};

export default function EventDetailsPage({
    event,
    attendees = [],
    attendees_count = 0,
    performance_data = [],
    performance_count = 0,
    attendance_info,
    auth,
}: EventDetailsPageProps) {
    // Time calculations
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
                return { icon: '👥', label: event.participation_scope } as const;
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

    // Determine which tabs to show
    const showAttendance = event.open_for_attendance && attendees.length > 0;
    const showPerformance = event.type === 'contest' && performance_data.length > 0;
    const shouldShowTabs = showAttendance && showPerformance; // Only show tabs if BOTH sections exist

    const defaultTab = showAttendance ? 'attendance' : 'performance';

    return (
        <MainLayout>
            <Head title={event.title} />

            <section className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/events">
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
                                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(start)}
                                        {' - '}
                                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(end)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{formatDuration()}</span>
                                </div>
                            </div>

                            {event.description && <p className="mb-4 text-slate-600 dark:text-slate-300">{event.description}</p>}
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

                        {showAttendance && (
                            <Badge variant="outline" className="border-slate-200 bg-white/30 dark:border-slate-700 dark:bg-slate-800/30">
                                <Users className="mr-1 h-3 w-3" />
                                {attendees_count} {attendees_count === 1 ? 'attendee' : 'attendees'}
                            </Badge>
                        )}
                    </div>

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
                        {attendance_info && (
                            <AttendanceButton
                                eventId={event.id}
                                openForAttendance={event.open_for_attendance}
                                hasPassword={attendance_info.has_password}
                                userAlreadyAttended={attendance_info.user_already_attended}
                                attendanceWindowEnabled={attendance_info.attendance_window_enabled}
                                attendanceWindowStart={attendance_info.attendance_window_start}
                                attendanceWindowEnd={attendance_info.attendance_window_end}
                                startingAt={event.starting_at}
                                endingAt={event.ending_at}
                                isAuthenticated={!!auth?.user}
                                state={attendance_info.state}
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

                {/* Content - Enhanced with gradient styling */}
                {shouldShowTabs ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <Tabs defaultValue={defaultTab} className="w-full">
                                <TabsList className="mb-6 w-full bg-slate-100 p-1 sm:w-fit dark:bg-slate-800">
                                    {showAttendance && (
                                        <TabsTrigger value="attendance" className="flex items-center gap-2 rounded-lg">
                                            <Users className="h-4 w-4" />
                                            <span>Attendees ({attendees_count})</span>
                                        </TabsTrigger>
                                    )}
                                    {showPerformance && (
                                        <TabsTrigger value="performance" className="flex items-center gap-2 rounded-lg">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Performance ({performance_count})</span>
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {showAttendance && (
                                    <TabsContent value="attendance" className="mt-4 p-0">
                                        <AttendanceTab attendees={attendees} />
                                    </TabsContent>
                                )}

                                {showPerformance && (
                                    <TabsContent value="performance" className="mt-4 p-0">
                                        <PerformanceTab performanceData={performance_data} />
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    </div>
                ) : showAttendance ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Attendees ({attendees_count})
                            </h2>
                            <AttendanceTab attendees={attendees} />
                        </div>
                    </div>
                ) : showPerformance ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative z-10 p-6">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Performance ({performance_count})
                            </h2>
                            <PerformanceTab performanceData={performance_data} />
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
                            {event.open_for_attendance && event.type !== 'contest' && attendees_count === 0 && 'No one has attended this event yet.'}
                            {event.type === 'contest' && performance_count === 0 && 'No performance data is available for this contest yet.'}
                        </p>
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
