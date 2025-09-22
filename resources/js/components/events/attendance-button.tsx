import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Calendar, CheckCircle, Shield, Timer, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AttendanceButtonProps {
    eventId: number;
    openForAttendance: boolean;
    hasPassword?: boolean;
    userAlreadyAttended: boolean;
    attendanceWindowEnabled: boolean;
    attendanceWindowStart: string | null;
    attendanceWindowEnd: string | null;
    isAuthenticated: boolean;
    state?: 'before_window' | 'during_window' | 'after_window';
}

export function AttendanceButton({
    eventId,
    openForAttendance,
    hasPassword = false,
    userAlreadyAttended,
    attendanceWindowEnabled,
    attendanceWindowStart,
    attendanceWindowEnd,
    isAuthenticated,
    state,
}: AttendanceButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const windowStartDate = attendanceWindowStart ? new Date(attendanceWindowStart) : null;
    const windowEndDate = attendanceWindowEnd ? new Date(attendanceWindowEnd) : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/events/${eventId}/attendance`, {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success('Attendance confirmed successfully!', {
                    description: 'Your attendance has been recorded for this event.',
                    duration: 4000,
                });
            },
            onError: (errors) => {
                // Show error toast for attendance or password errors
                if (errors.attendance) {
                    toast.error('Attendance Failed', {
                        description: errors.attendance,
                        duration: 5000,
                    });
                } else if (errors.password) {
                    toast.error('Invalid Password', {
                        description: errors.password,
                        duration: 5000,
                    });
                } else {
                    toast.error('Something went wrong', {
                        description: 'Please try again or contact support.',
                        duration: 5000,
                    });
                }
            },
        });
    };

    // RULE 1: If open_for_attendance is false, don't show the button at all
    if (!openForAttendance) {
        return null;
    }

    // RULE 2: If user already attended, show confirmation badge
    if (userAlreadyAttended) {
        return (
            <Badge className="border-green-300 bg-green-100 px-4 py-2 text-green-700 dark:border-green-800/30 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-2 h-4 w-4" />
                Attendance Confirmed
            </Badge>
        );
    }

    // RULE 3: Before attendance window - show "Attendance Opens Soon"
    if (state === 'before_window') {
        return (
            <div className="flex flex-col gap-2">
                <Button
                    disabled
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                    <Timer className="mr-2 h-4 w-4" />
                    Attendance Opens Soon
                </Button>
                <p className="max-w-sm text-xs text-slate-600 dark:text-slate-400">
                    Attendance will open {windowStartDate ? formatDistanceToNow(windowStartDate, { addSuffix: true }) : 'soon'}
                    {windowStartDate && ' (15 minutes before event start)'}
                </p>
            </div>
        );
    }

    // RULE 4: After attendance window - show "Attendance Closed"
    if (state === 'after_window') {
        return (
            <div className="flex flex-col gap-2">
                <Button
                    disabled
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400"
                >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Attendance Closed
                </Button>
                <p className="max-w-sm text-xs text-red-600 dark:text-red-400">
                    Attendance window ended {windowEndDate ? formatDistanceToNow(windowEndDate, { addSuffix: true }) : 'recently'}
                </p>
            </div>
        );
    }

    // RULE 5: During attendance window - check password and authentication
    if (state === 'during_window' || attendanceWindowEnabled) {
        // RULE 5a: No password set - show error message
        if (!hasPassword) {
            return (
                <div className="flex flex-col gap-2">
                    <Button
                        disabled
                        variant="outline"
                        className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/30 dark:bg-orange-900/20 dark:text-orange-400"
                    >
                        <Shield className="mr-2 h-4 w-4" />
                        Password Not Set
                    </Button>
                    <p className="max-w-sm text-xs text-orange-600 dark:text-orange-400">
                        The event organizer hasn't set the attendance password yet. Please check back later or contact the event manager.
                    </p>
                </div>
            );
        }

        // RULE 5b: Password set but user not logged in - show login prompt
        if (!isAuthenticated) {
            return (
                <Button onClick={() => router.visit('/login')} className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Login to Give Attendance
                </Button>
            );
        }

        // RULE 5c: Password set and user logged in - show attendance button
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                        <Users className="mr-2 h-4 w-4" />
                        Give Attendance
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Confirm Attendance
                        </DialogTitle>
                        <DialogDescription>Enter the event password to confirm your attendance.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Event Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter event password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoFocus
                            />
                            {errors.password && <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
                        </div>

                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                            <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-medium">Attendance Window</p>
                                    <p className="mt-1 text-xs">
                                        Available until {windowEndDate ? formatDistanceToNow(windowEndDate, { addSuffix: true }) : 'event ends'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !data.password.trim()}>
                                {processing ? 'Confirming...' : 'Confirm Attendance'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    }

    // Fallback for any other state - don't show button
    return null;
}
