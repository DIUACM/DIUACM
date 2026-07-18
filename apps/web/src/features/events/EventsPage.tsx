import { CalendarDays, Clock } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useEvents } from '@/api/queries/events'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EVENT_TYPE_LABELS, SCOPE_LABELS } from '@/lib/constants'
import { formatDateTime, formatDuration } from '@/lib/datetime'
import type { EventListItem, EventType, ParticipationScope } from '@/api/types'
import { EventTimingBadge, EventTypeBadge, ScopeBadge } from './EventBadges'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

const ALL = 'all'

export function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link to={`/events/${event.id}`} className="group block">
      <Card className="transition-colors group-hover:border-primary/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeBadge type={event.type} />
            <ScopeBadge scope={event.participationScope} />
            <EventTimingBadge
              startingAt={event.startingAt}
              endingAt={event.endingAt}
            />
          </div>
          <h3 className="text-lg font-semibold group-hover:underline">
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
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-40 rounded-xl" />
      ))}
    </div>
  )
}

export function EventsPage() {
  useDocumentTitle('Events')
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const type = (searchParams.get('type') as EventType | null) ?? undefined
  const scope = (searchParams.get('scope') as ParticipationScope | null) ?? undefined
  const q = searchParams.get('q') ?? ''

  const eventsQuery = useEvents({ page, type, scope, q })

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || value === ALL) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Contests, classes, and community events."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search events…"
          className="flex-1"
        />
        <Select
          value={type ?? ALL}
          onValueChange={(value) => updateParams({ type: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={scope ?? ALL}
          onValueChange={(value) => updateParams({ scope: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All scopes</SelectItem>
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {eventsQuery.isPending ? (
        <EventListSkeleton />
      ) : eventsQuery.isError ? (
        <ErrorState
          error={eventsQuery.error}
          onRetry={() => void eventsQuery.refetch()}
        />
      ) : eventsQuery.data.data.length === 0 ? (
        <EmptyState message="No events match your filters." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {eventsQuery.data.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination
            meta={eventsQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
