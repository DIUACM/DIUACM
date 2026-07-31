import { CheckCircle2 } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useEventAttendance } from '@/api/queries/events'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { eventTiming } from '@/lib/datetime'
import type { EventDetail } from '@/api/types'
import { AttendanceDialog } from './AttendanceDialog'

/**
 * The event's primary call to action. Signed-out visitors still see it — the
 * button sends them to login and back here, rather than the CTA being missing
 * with no explanation of what to do about it.
 */
export function AttendanceAction({ event }: { event: EventDetail }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  // Shares the roster the attendance tab already loads, so telling whether the
  // signed-in user is on it costs no extra request.
  const attendanceQuery = useEventAttendance(event.id, isAuthenticated)

  if (!event.openForAttendance || eventTiming(event.startingAt, event.endingAt) === 'ended') {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Button size="lg" asChild>
        <Link to="/login" state={{ from: location.pathname }}>
          Give attendance
        </Link>
      </Button>
    )
  }

  // Hold the button disabled until the roster answers, so an already-recorded
  // attendance doesn't flash a live CTA before flipping to the confirmation.
  if (attendanceQuery.isPending) {
    return (
      <Button size="lg" disabled>
        Give attendance
      </Button>
    )
  }

  // `a.user` is null for deleted accounts, so the id comparison only runs once
  // there's a signed-in user to compare against. A failed roster fetch simply
  // leaves the CTA in place.
  const attended =
    user !== null && (attendanceQuery.data?.data.some((a) => a.user?.id === user.id) ?? false)
  if (attended) {
    return (
      <div className="inline-flex h-11 items-center gap-2 rounded-full bg-green-100 px-5 text-sm font-medium text-green-800 shadow-clay-sm dark:bg-green-950 dark:text-green-300">
        <CheckCircle2 className="size-4.5" />
        Attendance confirmed
      </div>
    )
  }

  return <AttendanceDialog eventId={event.id} />
}
