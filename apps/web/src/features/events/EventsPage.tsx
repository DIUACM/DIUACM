import { useSearchParams } from 'react-router'
import { useEvents } from '@/api/queries/events'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EVENT_TYPE_LABELS, SCOPE_LABELS } from '@/lib/constants'
import type { EventType, ParticipationScope } from '@/api/types'
import { EventCard, EventListSkeleton } from './EventCard'
import { useDocumentTitle } from '@/lib/use-document-title'

const ALL = 'all'

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
          <div className="grid gap-5 sm:grid-cols-2">
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
