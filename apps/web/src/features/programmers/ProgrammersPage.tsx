import { Link, useSearchParams } from 'react-router'
import { useProgrammers } from '@/api/queries/programmers'
import { CfRatingBadge } from '@/components/shared/CfRatingBadge'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { HANDLE_LABELS, HANDLE_TYPES } from '@/lib/constants'
import type { ProgrammerListItem } from '@/api/types'
import { useDocumentTitle } from '@/lib/use-document-title'

function ProgrammerCard({ programmer }: { programmer: ProgrammerListItem }) {
  const platforms = HANDLE_TYPES.filter(
    (type) => programmer.handles[type].length > 0,
  )
  return (
    <Link to={`/programmers/${programmer.username}`} className="group block">
      <Card className="clay-lift h-full">
        <CardContent className="flex items-center gap-4">
          <UserAvatar
            name={programmer.name}
            image={programmer.image}
            className="size-12 shadow-clay-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold transition-colors group-hover:text-primary">
                {programmer.name}
              </h3>
              <CfRatingBadge rating={programmer.maxCfRating} className="text-sm" />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              @{programmer.username}
            </p>
            {platforms.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {platforms.map((type) => HANDLE_LABELS[type]).join(' · ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ProgrammersPage() {
  useDocumentTitle('Programmers')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''

  const programmersQuery = useProgrammers({ page, q })

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="Programmers"
        description="Members of the community and their competitive programming profiles."
      />

      <SearchInput
        value={q}
        onChange={(value) => updateParams({ q: value, page: undefined })}
        placeholder="Search by name, username, or student ID…"
        className="mb-6 max-w-md"
      />

      {programmersQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : programmersQuery.isError ? (
        <ErrorState
          error={programmersQuery.error}
          onRetry={() => void programmersQuery.refetch()}
        />
      ) : programmersQuery.data.data.length === 0 ? (
        <EmptyState message="No programmers found." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmersQuery.data.data.map((programmer) => (
              <ProgrammerCard key={programmer.id} programmer={programmer} />
            ))}
          </div>
          <Pagination
            meta={programmersQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
