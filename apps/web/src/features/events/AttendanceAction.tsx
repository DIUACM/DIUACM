import { CheckCircle2, Clock, LoaderCircle, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useEventAttendance } from '@/api/queries/events'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import {
  ATTENDANCE_WINDOW_SECONDS,
  attendanceWindowTiming,
  formatDateTime,
} from '@/lib/datetime'
import type { EventDetail } from '@/api/types'
import { AttendanceDialog } from './AttendanceDialog'
import { resolveAttendanceDisplayState } from './attendance-state'

/**
 * The event's primary call to action. Signed-out visitors still see it — the
 * button sends them to login and back here, rather than the CTA being missing
 * with no explanation of what to do about it.
 */
export function AttendanceAction({ event }: { event: EventDetail }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const windowTiming = attendanceWindowTiming(event.startingAt, event.endingAt, now)

  // Keep the state accurate when somebody leaves the event page open across an
  // attendance-window boundary.
  useEffect(() => {
    if (!event.openForAttendance) return
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [event.openForAttendance])

  // Shares the roster the attendance tab already loads, so telling whether the
  // signed-in user is on it costs no extra request. This remains enabled outside
  // the window because confirmation is independent from the current window.
  const attendanceQuery = useEventAttendance(event.id, isAuthenticated)
  const attended =
    user !== null && (attendanceQuery.data?.data.some((a) => a.user?.id === user.id) ?? false)
  const displayState = resolveAttendanceDisplayState({
    isAuthenticated,
    isAttendanceEnabled: event.openForAttendance,
    isRosterPending: attendanceQuery.isPending,
    attended,
    windowTiming,
  })

  if (displayState.confirmation === 'hidden' && displayState.window === 'hidden') return null

  const opensAt = event.startingAt - ATTENDANCE_WINDOW_SECONDS

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayState.confirmation === 'checking' && (
        <div
          role="status"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-muted px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-clay-sm"
        >
          <LoaderCircle className="size-4.5 animate-spin" />
          <span>Checking attendance…</span>
        </div>
      )}

      {displayState.confirmation === 'confirmed' && (
        <div
          role="status"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-green-100 px-5 py-2.5 text-sm font-medium text-green-800 shadow-clay-sm dark:bg-green-950 dark:text-green-300"
        >
          <CheckCircle2 className="size-4.5" />
          <span>Attendance confirmed</span>
        </div>
      )}

      {displayState.window === 'upcoming' && (
        <div
          role="status"
          className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-sm font-medium text-amber-900 shadow-clay-sm dark:bg-amber-950 dark:text-amber-200"
        >
          <Clock className="size-4.5" />
          <span>
            Attendance is not open yet — opens {formatDateTime(opensAt)}
          </span>
        </div>
      )}

      {displayState.window === 'closed' && (
        <div
          role="status"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-muted px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-clay-sm"
        >
          <Lock className="size-4.5" />
          <span>Attendance window has closed</span>
        </div>
      )}

      {displayState.window === 'open' &&
        (isAuthenticated ? (
          <AttendanceDialog eventId={event.id} />
        ) : (
          <Button size="lg" asChild>
            <Link to="/login" state={{ from: location.pathname }}>
              Give attendance
            </Link>
          </Button>
        ))}
    </div>
  )
}
