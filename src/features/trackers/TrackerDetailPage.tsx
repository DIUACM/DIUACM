import { ArrowLeft, CalendarDays, Lock, Users } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useTracker } from '@/api/queries/trackers'
import { ErrorState, EmptyState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

export function TrackerDetailPage() {
  const { slug = '' } = useParams()
  const trackerQuery = useTracker(slug)
  useDocumentTitle(trackerQuery.data?.title)

  if (trackerQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-48 w-full" />
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

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/trackers">
            <ArrowLeft className="size-4" /> All trackers
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{tracker.title}</h1>
        {tracker.description && (
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            {stripHtml(tracker.description)}
          </p>
        )}
      </div>

      {tracker.ranklists.length === 0 ? (
        <EmptyState message="No ranklists published in this tracker yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tracker.ranklists.map((ranklist) => (
            <Link
              key={ranklist.keyword}
              to={`/trackers/${tracker.slug}/${ranklist.keyword}`}
              className="group block"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold group-hover:underline">
                      {ranklist.keyword}
                    </h3>
                    {ranklist.isLocked && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" /> Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" /> {ranklist.userCount} participants
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" /> {ranklist.eventCount} events
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upsolve weight: {ranklist.upsolveWeight}
                    {ranklist.considerStrictAttendance &&
                      ' · strict attendance applies'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
