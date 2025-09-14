import React, { useState } from 'react'
import { usePage, router, useForm } from '@inertiajs/react'
import MainLayout from '@/layouts/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Lock,
    CheckCircle,
    ExternalLink,
    ArrowLeft,
    AlertTriangle
} from 'lucide-react'

type EventAttendee = {
    id: number
    name: string
    image_url: string
    department: string | null
    student_id: string | null
    attended_at: string
}

type EventData = {
    id: number
    title: string
    description: string | null
    starting_at: string
    ending_at: string
    event_link: string | null
    open_for_attendance: boolean
    strict_attendance: boolean
    type: 'contest' | 'class' | 'other'
    participation_scope: 'open_for_all' | 'only_girls' | 'junior_programmers' | 'selected_persons'
    attendees_count: number
    attendees: EventAttendee[]
    is_attendance_window_enabled: boolean
    has_password: boolean
}

type PageProps = {
    event: EventData
    user_has_attended: boolean
    auth?: {
        user: any
    }
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date)
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date)
}

function formatTimeRange(startStr: string, endStr: string) {
    return `${formatTime(startStr)} - ${formatTime(endStr)}`
}

function typeLabel(t: EventData['type']) {
    return t === 'contest' ? 'Contest' : t === 'class' ? 'Class' : 'Other'
}

function scopeLabel(s: EventData['participation_scope']) {
    switch (s) {
        case 'open_for_all':
            return 'Open for All'
        case 'only_girls':
            return 'Only Girls'
        case 'junior_programmers':
            return 'Junior Programmers'
        case 'selected_persons':
            return 'Selected Persons'
        default:
            return 'Open for All'
    }
}

function StatusBadge({ start, end }: { start: string; end: string }) {
    const now = new Date()
    const s = new Date(start)
    const e = new Date(end)
    let label = 'Upcoming'
    let cls = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
    
    if (now >= s && now <= e) {
        label = 'Running'
        cls = 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300/70 dark:border-blue-700/70 text-blue-700 dark:text-blue-300'
    } else if (now > e) {
        label = 'In Past'
        cls = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
    
    return (
        <Badge variant="outline" className={cls}>
            {label}
        </Badge>
    )
}

function AttendanceModal({ event, userHasAttended, isAuthenticated, onSuccess }: { 
    event: EventData
    userHasAttended: boolean
    isAuthenticated: boolean
    onSuccess: () => void 
}) {
    const [isOpen, setIsOpen] = useState(false)
    
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    })

    const handleAttendanceClick = () => {
        if (!isAuthenticated) {
            // Redirect to login page
            router.visit('/login')
            return
        }
        
        if (!event.has_password) {
            toast.error('Please ask the admin to set a password for this event')
            return
        }
        
        setIsOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!data.password.trim()) {
            toast.error('Please enter the event password')
            return
        }

        post(`/events/${event.id}/attend`, {
            onSuccess: () => {
                toast.success('Attendance marked successfully!')
                setIsOpen(false)
                reset()
                onSuccess()
            },
            onError: (errors) => {
                // Handle validation errors
                if (errors.password) {
                    toast.error(errors.password)
                } else if (errors.message) {
                    toast.error(errors.message)
                } else {
                    toast.error('Failed to mark attendance. Please try again.')
                }
            }
        })
    }

    if (!event.has_password) {
        return (
            <Button
                onClick={() => toast.error('Please ask the admin to set a password for this event')}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled
            >
                <AlertTriangle className="h-4 w-4 mr-2" />
                No Password Set
            </Button>
        )
    }

    if (isAuthenticated && userHasAttended) {
        return (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Attendance Marked
            </Button>
        )
    }

    if (!event.is_attendance_window_enabled) {
        return (
            <Button className="w-full" disabled variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Attendance Window Closed
            </Button>
        )
    }

    return (
        <>
            <Button 
                onClick={handleAttendanceClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                <Users className="h-4 w-4 mr-2" />
                {!isAuthenticated ? 'Login to Mark Attendance' : 'Mark Attendance'}
            </Button>
            
            {isAuthenticated && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <div className="text-center space-y-6">
                            <div>
                                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold">Mark Attendance</DialogTitle>
                                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                                        Enter the event password to confirm your attendance for "{event.title}".
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Event Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="text"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter event password"
                                        className="w-full"
                                        autoFocus
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Marking Attendance...
                                            </>
                                        ) : (
                                            'Mark Attendance'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

function AttendeesList({ attendees }: { attendees: EventAttendee[] }) {
    if (attendees.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No attendees yet</h3>
                <p className="text-sm">Be the first to mark your attendance!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Grid layout optimized for full width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {attendees.map((attendee) => (
                    <div
                        key={attendee.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={attendee.image_url} alt={attendee.name} />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
                                {attendee.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                                {attendee.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                {attendee.department && (
                                    <span className="truncate">{attendee.department}</span>
                                )}
                                {attendee.student_id && (
                                    <>
                                        {attendee.department && <span>•</span>}
                                        <span className="truncate">{attendee.student_id}</span>
                                    </>
                                )}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(attendee.attended_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Summary footer */}
            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total: <span className="font-medium">{attendees.length}</span> attendee{attendees.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    )
}

export default function EventShow() {
    const { props } = usePage<PageProps>()
    const { event, user_has_attended, auth } = props
    const [localUserHasAttended, setLocalUserHasAttended] = useState(user_has_attended)

    const handleAttendanceSuccess = () => {
        setLocalUserHasAttended(true)
        // Refresh the page to get updated attendee list
        router.reload({ only: ['event', 'user_has_attended'] })
    }

    const goBack = () => {
        window.history.back()
    }

    return (
        <MainLayout title={event.title}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={goBack}
                        variant="ghost"
                        className="mb-4 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Events
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <StatusBadge start={event.starting_at} end={event.ending_at} />
                                <Badge variant="secondary" className="capitalize">
                                    {typeLabel(event.type)}
                                </Badge>
                                <Badge variant="outline">
                                    {scopeLabel(event.participation_scope)}
                                </Badge>
                            </div>
                        </div>
                        
                        {event.open_for_attendance && (
                            <div className="sm:w-64">
                                <AttendanceModal
                                    event={event}
                                    userHasAttended={localUserHasAttended}
                                    isAuthenticated={!!auth?.user}
                                    onSuccess={handleAttendanceSuccess}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Event Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Event Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Date
                                        </Label>
                                        <p className="font-medium">
                                            {formatDate(event.starting_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Time
                                        </Label>
                                        <p className="font-medium">
                                            {formatTimeRange(event.starting_at, event.ending_at)}
                                        </p>
                                    </div>
                                </div>
                                
                                {event.description && (
                                    <div>
                                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Description
                                        </Label>
                                        <div 
                                            className="text-slate-700 dark:text-slate-200 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: event.description }}
                                        />
                                    </div>
                                )}

                                {event.event_link && (
                                    <div>
                                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Event Link
                                        </Label>
                                        <a
                                            href={event.event_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            {event.event_link}
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attendance Requirements */}
                        {event.open_for_attendance && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        Attendance Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`h-2 w-2 rounded-full ${event.has_password ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className={event.has_password ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                            {event.has_password ? 'Password protected' : 'No password set (contact admin)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`h-2 w-2 rounded-full ${event.is_attendance_window_enabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                                        <span className={event.is_attendance_window_enabled ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                                            {event.is_attendance_window_enabled ? 'Attendance window open' : 'Attendance window closed'}
                                        </span>
                                    </div>
                                    {event.strict_attendance && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                                            <span className="text-orange-700 dark:text-orange-400">
                                                Strict attendance policy
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Full Width Attendance List - Only show if attendance is enabled */}
                    {event.open_for_attendance && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Attendees ({event.attendees_count})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AttendeesList attendees={event.attendees} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}