import { ArrowLeft, CalendarDays, Lock, Users } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useRanklist, useTracker } from '@/api/queries/trackers'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'
import { StandingsTable } from './StandingsTable'

export function TrackerDetailPage() {
  const { slug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword')

  const trackerQuery = useTracker(slug)
  const ranklists = trackerQuery.data?.ranklists ?? []
  // The API returns ranklists in admin-defined display order, latest first.
  const latestKeyword = ranklists[0]?.keyword
  const activeKeyword = urlKeyword ?? latestKeyword ?? ''

  // With ?keyword= in the URL this fetches in parallel with the tracker;
  // otherwise it starts as soon as the tracker resolves the latest keyword.
  const ranklistQuery = useRanklist(slug, activeKeyword)

  const title = trackerQuery.data?.title
  useDocumentTitle(
    title && activeKeyword ? `${activeKeyword} · ${title}` : title,
  )

  if (trackerQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (trackerQuery.isError) {
    return (
      <ErrorState
        error={trackerQuery.error}
        onRetry={() => void trackerQuery.refetch()}
      />
    )
  }

  const tracker = trackerQuery.data
  const activeRanklist = ranklists.find((r) => r.keyword === activeKeyword)

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/trackers">
            <ArrowLeft className="size-4" /> All trackers
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">{tracker.title}</h1>
        {tracker.description && (
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            {stripHtml(tracker.description)}
          </p>
        )}
      </div>

      {ranklists.length === 0 ? (
        <EmptyState message="No ranklists published in this tracker yet." />
      ) : (
        <div className="space-y-4">
          <Tabs
            value={activeKeyword}
            onValueChange={(keyword) => setSearchParams({ keyword })}
          >
            <div className="overflow-x-auto pb-1">
              <TabsList>
                {ranklists.map((ranklist) => (
                  <TabsTrigger key={ranklist.keyword} value={ranklist.keyword}>
                    {ranklist.keyword}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {activeRanklist && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" /> {activeRanklist.userCount}{' '}
                participants
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {activeRanklist.eventCount}{' '}
                events
              </span>
              <span>Upsolve weight: {activeRanklist.upsolveWeight}</span>
              {activeRanklist.considerStrictAttendance && (
                <span>Strict attendance applies</span>
              )}
              {activeRanklist.isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="size-3" /> Locked
                </Badge>
              )}
            </div>
          )}

          {ranklistQuery.isPending ? (
            <Skeleton className="h-96 w-full rounded-3xl" />
          ) : ranklistQuery.isError ? (
            <ErrorState
              error={ranklistQuery.error}
              onRetry={() => void ranklistQuery.refetch()}
            />
          ) : ranklistQuery.data.users.length === 0 ? (
            <EmptyState message="No participants in this ranklist yet." />
          ) : (
            <StandingsTable standings={ranklistQuery.data} />
          )}
        </div>
      )}
    </div>
  )
}
