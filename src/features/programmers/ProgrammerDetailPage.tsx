import { ArrowLeft, ExternalLink, Trophy } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useProgrammer } from '@/api/queries/programmers'
import { CfRatingBadge } from '@/components/shared/CfRatingBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { HANDLE_LABELS, HANDLE_TYPES, handleProfileUrl } from '@/lib/constants'
import { useDocumentTitle } from '@/lib/use-document-title'

export function ProgrammerDetailPage() {
  const { username = '' } = useParams()
  const programmerQuery = useProgrammer(username)
  useDocumentTitle(programmerQuery.data?.name)

  if (programmerQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (programmerQuery.isError) {
    return (
      <ErrorState
        error={programmerQuery.error}
        onRetry={() => void programmerQuery.refetch()}
      />
    )
  }

  const programmer = programmerQuery.data
  const handles = HANDLE_TYPES.flatMap((type) => {
    const handle = programmer.handles[type]
    return handle ? [{ type, handle }] : []
  })

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/programmers">
            <ArrowLeft className="size-4" /> All programmers
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar
            name={programmer.name}
            image={programmer.image}
            className="size-20 text-xl"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {programmer.name}
              </h1>
              <CfRatingBadge rating={programmer.maxCfRating} className="text-lg" />
            </div>
            <p className="text-muted-foreground">@{programmer.username}</p>
          </div>
        </div>
      </div>

      {handles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {handles.map(({ type, handle }) => (
            <Button key={type} variant="outline" size="sm" asChild>
              <a
                href={handleProfileUrl(type, handle)}
                target="_blank"
                rel="noreferrer"
              >
                {HANDLE_LABELS[type]}: {handle}
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">Tracker performance</h2>
        {programmer.trackerPerformance.length === 0 ? (
          <EmptyState message="Not part of any tracker ranklist yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {programmer.trackerPerformance.map((entry) => (
              <Card key={entry.tracker.slug}>
                <CardHeader>
                  <CardTitle>
                    <Link
                      to={`/trackers/${entry.tracker.slug}`}
                      className="hover:underline"
                    >
                      {entry.tracker.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {entry.ranklists.map((ranklist) => (
                      <li
                        key={ranklist.keyword}
                        className="flex items-center justify-between gap-3"
                      >
                        <Link
                          to={`/trackers/${entry.tracker.slug}/${ranklist.keyword}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {ranklist.keyword}
                        </Link>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Trophy className="size-3" />
                            {ranklist.rank} / {ranklist.userCount}
                          </Badge>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {ranklist.score.toFixed(2)} pts
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
