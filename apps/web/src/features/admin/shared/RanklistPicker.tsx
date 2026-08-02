import { Loader2 } from 'lucide-react'
import {
  useAdminRanklists,
  type AdminRanklistWithTracker,
} from '@/api/queries/admin-trackers'
import { errorMessage } from '@/api/client'
import { SearchDropdown } from '@/features/admin/shared/SearchDropdown'

interface RanklistPickerProps {
  onSelect: (ranklist: AdminRanklistWithTracker) => void
  placeholder?: string
}

function RanklistResults({
  query,
  onSelect,
}: {
  query: string
  onSelect: (ranklist: AdminRanklistWithTracker) => void
}) {
  const ranklistsQuery = useAdminRanklists({ q: query })

  if (ranklistsQuery.isPending) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    )
  }
  if (ranklistsQuery.isError) {
    return (
      <p className="px-3 py-2.5 text-sm text-destructive">
        {errorMessage(ranklistsQuery.error)}
      </p>
    )
  }
  if (ranklistsQuery.data.data.length === 0) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted-foreground">
        No ranklists found.
      </p>
    )
  }
  return ranklistsQuery.data.data.map((ranklist) => (
    <button
      key={ranklist.id}
      type="button"
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={() => onSelect(ranklist)}
    >
      <span className="min-w-0 flex-1 truncate font-medium">
        {ranklist.keyword}
      </span>
      <span className="shrink-0 truncate text-muted-foreground">
        {ranklist.trackerTitle}
      </span>
    </button>
  ))
}

/** Inline ranklist search backed by GET /admin/ranklists (needs `manage_trackers`). */
export function RanklistPicker({
  onSelect,
  placeholder = 'Search ranklists…',
}: RanklistPickerProps) {
  return (
    <SearchDropdown placeholder={placeholder}>
      {(query, close) => (
        <RanklistResults
          query={query}
          onSelect={(ranklist) => {
            onSelect(ranklist)
            close()
          }}
        />
      )}
    </SearchDropdown>
  )
}
