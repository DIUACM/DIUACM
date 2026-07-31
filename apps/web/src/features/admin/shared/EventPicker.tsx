import { Loader2 } from 'lucide-react'
import { useAdminEvents, type AdminEvent } from '@/api/queries/admin-events'
import { errorMessage } from '@/api/client'
import { SearchDropdown } from '@/features/admin/shared/SearchDropdown'
import { formatDate } from '@/lib/datetime'

interface EventPickerProps {
  onSelect: (event: AdminEvent) => void
  placeholder?: string
}

function EventResults({
  query,
  onSelect,
}: {
  query: string
  onSelect: (event: AdminEvent) => void
}) {
  const eventsQuery = useAdminEvents({ q: query })

  if (eventsQuery.isPending) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    )
  }
  if (eventsQuery.isError) {
    return (
      <p className="px-3 py-2.5 text-sm text-destructive">
        {errorMessage(eventsQuery.error)}
      </p>
    )
  }
  if (eventsQuery.data.data.length === 0) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted-foreground">No events found.</p>
    )
  }
  return eventsQuery.data.data.map((event) => (
    <button
      key={event.id}
      type="button"
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={() => onSelect(event)}
    >
      <span className="min-w-0 flex-1 truncate font-medium">{event.title}</span>
      <span className="shrink-0 text-muted-foreground">
        {formatDate(event.startingAt)}
      </span>
    </button>
  ))
}

/** Inline event search backed by GET /admin/events (needs `manage_events`). */
export function EventPicker({
  onSelect,
  placeholder = 'Search events…',
}: EventPickerProps) {
  return (
    <SearchDropdown placeholder={placeholder}>
      {(query, close) => (
        <EventResults
          query={query}
          onSelect={(event) => {
            onSelect(event)
            close()
          }}
        />
      )}
    </SearchDropdown>
  )
}
