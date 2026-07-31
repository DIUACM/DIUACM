import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  MoveHorizontal,
  Scale,
} from 'lucide-react'
import { Link } from 'react-router'
import { useEvent } from '@/api/queries/events'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EventTimingBadge, EventTypeBadge, ScopeBadge } from '@/features/events/EventBadges'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime, formatDuration } from '@/lib/datetime'
import type {
  RanklistEventEntry,
  RanklistStandings,
  RanklistStanding,
  RanklistUserPerformance,
} from '@/api/types'
import { cn, stripHtml } from '@/lib/utils'

const INITIAL_USER_COUNT = 30
const USER_BATCH_SIZE = 30
const RANK_COLUMN_WIDTH = 48
const PARTICIPANT_COLUMN_WIDTH = 176
const SCORE_COLUMN_WIDTH = 80
const EVENT_COLUMN_WIDTH = 128
const NON_EVENT_COLUMNS_WIDTH =
  RANK_COLUMN_WIDTH + PARTICIPANT_COLUMN_WIDTH + SCORE_COLUMN_WIDTH
const STICKY_COLUMNS_WIDTH = RANK_COLUMN_WIDTH + PARTICIPANT_COLUMN_WIDTH
const EVENT_COLUMN_OVERSCAN = 2

type EventColumnWindow = { start: number; end: number }

function calculateEventColumnWindow(
  scrollLeft: number,
  viewportWidth: number,
  eventCount: number,
): EventColumnWindow {
  // The score column scrolls away while rank + participant remain sticky. Work
  // in event-column coordinates, then keep two columns mounted on either side
  // so fast trackpad gestures never expose an empty strip.
  const visibleStart = Math.max(
    0,
    scrollLeft - (NON_EVENT_COLUMNS_WIDTH - STICKY_COLUMNS_WIDTH),
  )
  const visibleEnd = Math.max(
    0,
    scrollLeft + viewportWidth - NON_EVENT_COLUMNS_WIDTH,
  )

  return {
    start: Math.max(
      0,
      Math.floor(visibleStart / EVENT_COLUMN_WIDTH) - EVENT_COLUMN_OVERSCAN,
    ),
    end: Math.min(
      eventCount,
      Math.ceil(visibleEnd / EVENT_COLUMN_WIDTH) + EVENT_COLUMN_OVERSCAN,
    ),
  }
}

function useEventColumnWindow(eventCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [columnWindow, setColumnWindow] = useState<EventColumnWindow>(() =>
    calculateEventColumnWindow(0, 1024, eventCount),
  )

  const updateColumnWindow = useCallback(
    (scroller: HTMLDivElement) => {
      const next = calculateEventColumnWindow(
        scroller.scrollLeft,
        scroller.clientWidth,
        eventCount,
      )
      setColumnWindow((current) =>
        current.start === next.start && current.end === next.end ? current : next,
      )
    },
    [eventCount],
  )

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    updateColumnWindow(scroller)
    const observer = new ResizeObserver(() => updateColumnWindow(scroller))
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [updateColumnWindow])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => updateColumnWindow(event.currentTarget),
    [updateColumnWindow],
  )

  return { scrollerRef, columnWindow, handleScroll }
}

function rankStyle(rank: number): string {
  if (rank === 1) return 'text-amber-500 dark:text-amber-400'
  if (rank === 2) return 'text-zinc-400'
  if (rank === 3) return 'text-orange-600 dark:text-orange-500'
  return 'text-muted-foreground'
}

function PerformanceCell({ entry }: { entry: RanklistUserPerformance | undefined }) {
  if (!entry) {
    return <span className="text-muted-foreground/40">—</span>
  }
  return (
    <div className="leading-tight">
      <span className="font-medium">{entry.solveCount}</span>
      {entry.upsolveCount > 0 && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {' '}
          +{entry.upsolveCount}
        </span>
      )}
      {entry.position !== null && (
        <div className="text-[11px] text-muted-foreground">#{entry.position}</div>
      )}
    </div>
  )
}

const EventOverview = memo(function EventOverview({
  event,
}: {
  event: RanklistEventEntry
}) {
  const [open, setOpen] = useState(false)
  const eventQuery = useEvent(event.id, open)
  const detail = eventQuery.data
  const description = detail ? stripHtml(detail.description) : ''

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <Link
          to={`/events/${event.id}`}
          className="block max-w-36 truncate rounded-sm text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {event.title}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="space-y-3">
        {detail && (
          <div className="flex flex-wrap items-center gap-1.5">
            <EventTypeBadge type={detail.type} />
            <ScopeBadge scope={detail.participationScope} />
            <EventTimingBadge
              startingAt={detail.startingAt}
              endingAt={detail.endingAt}
            />
          </div>
        )}

        <div>
          <h3 className="font-heading text-base leading-snug font-semibold text-balance">
            {event.title}
          </h3>
          {eventQuery.isPending ? (
            <div className="mt-2 space-y-1.5" aria-label="Loading event overview">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : description ? (
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            {formatDateTime(event.startingAt)}
          </span>
          {detail && (
            <span className="flex items-center gap-2">
              <Clock3 className="size-3.5" />
              Duration: {formatDuration(detail.startingAt, detail.endingAt)}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Scale className="size-3.5" />
            Ranklist weight: {event.weight}
          </span>
        </div>

        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View event <ArrowUpRight className="size-3.5" />
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
})

interface StandingRowProps {
  standing: RanklistStanding
  visibleEvents: RanklistEventEntry[]
  leftSpacerWidth: number
  rightSpacerWidth: number
}

const StandingRow = memo(function StandingRow({
  standing,
  visibleEvents,
  leftSpacerWidth,
  rightSpacerWidth,
}: StandingRowProps) {
  const byEvent = useMemo(
    () => new Map(standing.performance.map((entry) => [entry.eventId, entry])),
    [standing.performance],
  )

  return (
    <tr className="group border-b transition-colors last:border-0 hover:bg-muted/40">
      <td
        className={cn(
          'sticky left-0 z-10 w-12 bg-card px-3 py-2.5 text-center font-bold tabular-nums transition-colors group-hover:bg-muted',
          rankStyle(standing.rank),
        )}
      >
        {standing.rank}
      </td>
      <td className="sticky left-12 z-10 w-44 bg-card px-3 py-2.5 transition-colors group-hover:bg-muted">
        <Link
          to={`/programmers/${standing.user.username}`}
          className="flex items-center gap-2.5 hover:underline"
        >
          <UserAvatar
            name={standing.user.name}
            image={standing.user.image}
            className="size-7 shadow-clay-sm"
          />
          <span className="max-w-36 truncate font-medium sm:max-w-40">
            {standing.user.name}
          </span>
        </Link>
      </td>
      <td className="w-20 px-3 py-2.5 text-right font-semibold tabular-nums">
        {standing.score.toFixed(2)}
      </td>
      {leftSpacerWidth > 0 && (
        <td
          aria-hidden="true"
          className="p-0"
          style={{ width: leftSpacerWidth }}
        />
      )}
      {visibleEvents.map((event) => (
        <td key={event.id} className="w-32 px-3 py-2.5">
          <PerformanceCell entry={byEvent.get(event.id)} />
        </td>
      ))}
      {rightSpacerWidth > 0 && (
        <td
          aria-hidden="true"
          className="p-0"
          style={{ width: rightSpacerWidth }}
        />
      )}
    </tr>
  )
})

export function StandingsTable({
  standings,
}: {
  standings: RanklistStandings
}) {
  const [visibleUserCount, setVisibleUserCount] = useState(INITIAL_USER_COUNT)
  const { scrollerRef, columnWindow, handleScroll } = useEventColumnWindow(
    standings.events.length,
  )
  const visibleUsers = useMemo(
    () => standings.users.slice(0, visibleUserCount),
    [standings.users, visibleUserCount],
  )
  const visibleEvents = useMemo(
    () => standings.events.slice(columnWindow.start, columnWindow.end),
    [standings.events, columnWindow.end, columnWindow.start],
  )
  const leftSpacerWidth = columnWindow.start * EVENT_COLUMN_WIDTH
  const rightSpacerWidth =
    (standings.events.length - columnWindow.end) * EVENT_COLUMN_WIDTH
  const totalTableWidth =
    NON_EVENT_COLUMNS_WIDTH + standings.events.length * EVENT_COLUMN_WIDTH
  const remainingUsers = standings.users.length - visibleUsers.length
  const nextUserBatchSize = Math.min(USER_BATCH_SIZE, remainingUsers)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground sm:hidden">
        <MoveHorizontal className="size-4 shrink-0" />
        Swipe horizontally to view event results
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="region"
        aria-label="Ranklist standings. Scroll horizontally to view event results."
        tabIndex={0}
        className="ranklist-scrollbar overflow-x-auto overscroll-x-contain rounded-3xl bg-card shadow-clay ring-1 ring-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <table
          className="w-full table-fixed border-collapse text-sm"
          style={{ minWidth: totalTableWidth }}
        >
          <thead>
            <tr className="border-b bg-muted/60 text-left text-muted-foreground">
              <th className="sticky left-0 z-20 w-12 bg-muted/90 px-3 py-3 text-center font-medium backdrop-blur">
                #
              </th>
              <th className="sticky left-12 z-20 w-44 bg-muted/90 px-3 py-3 font-medium backdrop-blur">
                Participant
              </th>
              <th className="w-20 px-3 py-3 text-right font-medium">Score</th>
              {leftSpacerWidth > 0 && (
                <th
                  aria-hidden="true"
                  className="p-0"
                  style={{ width: leftSpacerWidth }}
                />
              )}
              {visibleEvents.map((event) => (
                <th key={event.id} className="w-32 px-3 py-2 align-top font-medium">
                  <EventOverview event={event} />
                  <div className="mt-0.5 text-[11px] font-normal">
                    {formatDate(event.startingAt)} · w {event.weight}
                  </div>
                </th>
              ))}
              {rightSpacerWidth > 0 && (
                <th
                  aria-hidden="true"
                  className="p-0"
                  style={{ width: rightSpacerWidth }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((standing) => (
              <StandingRow
                key={standing.user.id}
                standing={standing}
                visibleEvents={visibleEvents}
                leftSpacerWidth={leftSpacerWidth}
                rightSpacerWidth={rightSpacerWidth}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-muted/45 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite">
          Showing <span className="font-medium text-foreground">{visibleUsers.length}</span>{' '}
          of <span className="font-medium text-foreground">{standings.users.length}</span>{' '}
          participants
        </p>
        {remainingUsers > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() =>
              setVisibleUserCount((count) =>
                Math.min(count + USER_BATCH_SIZE, standings.users.length),
              )
            }
          >
            Show {nextUserBatchSize} more
            <ChevronDown className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
