import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAdminEvents, type AdminEvent } from '@/api/queries/admin-events'
import { errorMessage } from '@/api/client'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/datetime'

interface EventPickerProps {
  onSelect: (event: AdminEvent) => void
  placeholder?: string
}

/** Inline event search backed by GET /admin/events (needs `manage_events`). */
export function EventPicker({
  onSelect,
  placeholder = 'Search events…',
}: EventPickerProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const timerRef = useRef<number>(undefined)
  const eventsQuery = useAdminEvents({ q: debounced }, debounced.length > 0)

  const handleChange = (value: string) => {
    setQuery(value)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setDebounced(value.trim()), 300)
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
      />
      {debounced.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
          {eventsQuery.isPending ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : eventsQuery.isError ? (
            <p className="px-3 py-2.5 text-sm text-destructive">
              {errorMessage(eventsQuery.error)}
            </p>
          ) : eventsQuery.data.data.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              No events found.
            </p>
          ) : (
            eventsQuery.data.data.map((event) => (
              <button
                key={event.id}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onSelect(event)
                  setQuery('')
                  setDebounced('')
                }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {event.title}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatDate(event.startingAt)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
