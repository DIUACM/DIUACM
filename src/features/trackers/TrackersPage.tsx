import { ChartNoAxesColumn } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useTrackers } from '@/api/queries/trackers'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/lib/use-document-title'

export function TrackersPage() {
  useDocumentTitle('Trackers')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const trackersQuery = useTrackers(page)

  return (
    <div>
      <PageHeader
        title="Trackers"
        description="Long-running leaderboards that track performance across events."
      />

      {trackersQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : trackersQuery.isError ? (
        <ErrorState
          error={trackersQuery.error}
          onRetry={() => void trackersQuery.refetch()}
        />
      ) : trackersQuery.data.data.length === 0 ? (
        <EmptyState message="No trackers published yet." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {trackersQuery.data.data.map((tracker) => (
              <Link
                key={tracker.slug}
                to={`/trackers/${tracker.slug}`}
                className="group block"
              >
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex flex-col gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ChartNoAxesColumn className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold group-hover:underline">
                      {tracker.title}
                    </h3>
                    {tracker.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {tracker.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            meta={trackersQuery.data.meta}
            onPageChange={(nextPage) =>
              setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  )
}
