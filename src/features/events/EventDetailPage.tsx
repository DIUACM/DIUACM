import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Trophy,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useEvent, useEventAttendance, useEventPerformance } from '@/api/queries/events'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime, formatDuration, eventTiming } from '@/lib/datetime'
import type { EventDetail } from '@/api/types'
import { AttendanceDialog } from './AttendanceDialog'
import { EventTimingBadge, EventTypeBadge, ScopeBadge } from './EventBadges'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

function AttendanceTab({ eventId }: { eventId: number }) {
  const attendanceQuery = useEventAttendance(eventId)

  if (attendanceQuery.isPending) return <Skeleton className="h-48 w-full" />
  if (attendanceQuery.isError) {
    return (
      <ErrorState
        error={attendanceQuery.error}
        onRetry={() => void attendanceQuery.refetch()}
      />
    )
  }

  const attendees = attendanceQuery.data.data
  if (attendees.length === 0) {
    return <EmptyState message="No one has marked attendance yet." />
  }

  return (
    <Card>
      <CardContent>
        <ul className="divide-y">
          {attendees.map((attendance, index) => (
            <li
              key={attendance.user?.id ?? index}
              className="flex items-center gap-3 py-2.5"
            >
              {attendance.user ? (
                <>
                  <UserAvatar
                    name={attendance.user.name}
                    image={attendance.user.image}
                  />
                  <Link
                    to={`/programmers/${attendance.user.username}`}
                    className="font-medium hover:underline"
                  >
                    {attendance.user.name}
                  </Link>
                </>
              ) : (
                <span className="text-muted-foreground">Deleted user</span>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {formatDateTime(attendance.attendedAt)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function PerformanceTab({ eventId }: { eventId: number }) {
  const performanceQuery = useEventPerformance(eventId)

  if (performanceQuery.isPending) return <Skeleton className="h-48 w-full" />
  if (performanceQuery.isError) {
    return (
      <ErrorState
        error={performanceQuery.error}
        onRetry={() => void performanceQuery.refetch()}
      />
    )
  }

  const rows = performanceQuery.data.data
  if (rows.length === 0) {
    return <EmptyState message="No performance data recorded for this event." />
  }

  return (
    <Card className="py-0">
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 pl-6 text-center">#</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead className="text-center">Solved</TableHead>
              <TableHead className="pr-6 text-center">Upsolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.user.id}>
                <TableCell className="pl-6 text-center font-medium text-muted-foreground">
                  {row.position ?? index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/programmers/${row.user.username}`}
                    className="flex items-center gap-2.5 hover:underline"
                  >
                    <UserAvatar name={row.user.name} image={row.user.image} className="size-7" />
                    <span className="font-medium">{row.user.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-center">{row.solveCount}</TableCell>
                <TableCell className="pr-6 text-center">{row.upsolveCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function EventDetailContent({ event }: { event: EventDetail }) {
  const { isAuthenticated } = useAuth()
  const timing = eventTiming(event.startingAt, event.endingAt)
  const canMarkAttendance =
    isAuthenticated && event.openForAttendance && timing !== 'ended'

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/events">
            <ArrowLeft className="size-4" /> All events
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeBadge type={event.type} />
          <ScopeBadge scope={event.participationScope} />
          <EventTimingBadge
            startingAt={event.startingAt}
            endingAt={event.endingAt}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex items-center gap-2">
            {event.eventLink && (
              <Button variant="outline" asChild>
                <a href={event.eventLink} target="_blank" rel="noreferrer">
                  Event link <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
            {canMarkAttendance && <AttendanceDialog eventId={event.id} />}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatDateTime(event.startingAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {formatDuration(event.startingAt, event.endingAt)}
          </span>
        </div>
      </div>

      {event.description && (
        <p className="max-w-3xl whitespace-pre-line text-muted-foreground">
          {stripHtml(event.description)}
        </p>
      )}

      {event.media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {event.media.map(
            (media) =>
              media.url && (
                <a
                  key={media.id}
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={media.url}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ),
          )}
        </div>
      )}

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">
            <Trophy className="size-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Users className="size-4" /> Attendance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab eventId={event.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function EventDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const eventQuery = useEvent(id)
  useDocumentTitle(eventQuery.data?.title)

  if (eventQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (eventQuery.isError) {
    return (
      <ErrorState
        error={eventQuery.error}
        onRetry={() => void eventQuery.refetch()}
      />
    )
  }

  return <EventDetailContent event={eventQuery.data} />
}
