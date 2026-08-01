import { CalendarDays, Clock } from 'lucide-react'
import { Link } from 'react-router'
import type { EventListItem } from '@/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatDuration } from '@/lib/datetime'
import { stripHtml } from '@/lib/utils'
import { EventTimingBadge, EventTypeBadge, ScopeBadge } from './EventBadges'

export function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link to={`/events/${event.id}`} className="group clay-lift-trigger block">
      <Card className="clay-lift">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeBadge type={event.type} />
            <ScopeBadge scope={event.participationScope} />
            <EventTimingBadge
              startingAt={event.startingAt}
              endingAt={event.endingAt}
            />
          </div>
          <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
            {event.title}
          </h3>
          {event.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {stripHtml(event.description)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDateTime(event.startingAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatDuration(event.startingAt, event.endingAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function EventListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-40 rounded-2xl" />
      ))}
    </div>
  )
}
