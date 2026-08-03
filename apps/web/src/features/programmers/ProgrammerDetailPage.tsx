import { ArrowLeft, ExternalLink, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useProgrammer } from '@/api/queries/programmers'
import { CfRatingBadge } from '@/components/shared/CfRatingBadge'
import { BannedBadge } from '@/components/shared/BannedBadge'
import { Lightbox } from '@/components/shared/Lightbox'
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
  const [viewingPhoto, setViewingPhoto] = useState(false)
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
  const handles = HANDLE_TYPES.flatMap((type) =>
    programmer.handles[type].map(({ id, handle }) => ({ id, type, handle })),
  )

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/programmers">
            <ArrowLeft className="size-4" /> All programmers
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          {/* Only worth opening when there's a real photo behind it — the
              initials fallback has nothing more to show at full size. */}
          {programmer.image ? (
            <button
              type="button"
              onClick={() => setViewingPhoto(true)}
              aria-label={`View ${programmer.name}'s photo`}
              className="cursor-zoom-in rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <UserAvatar
                name={programmer.name}
                image={programmer.image}
                imagePreset="profileAvatar"
                className="size-24 text-2xl shadow-clay transition-transform hover:scale-105"
              />
            </button>
          ) : (
            <UserAvatar
              name={programmer.name}
              image={programmer.image}
              imagePreset="profileAvatar"
              className="size-24 text-2xl shadow-clay"
            />
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-balance sm:text-4xl">
                {programmer.name}
              </h1>
              {programmer.isBanned && <BannedBadge reason={programmer.banReason} />}
            </div>
            <p className="text-muted-foreground">@{programmer.username}</p>
            {programmer.maxCfRating !== null && (
              <p className="mt-1 text-sm">
                <span className="text-muted-foreground">Max Codeforces: </span>
                <CfRatingBadge rating={programmer.maxCfRating} showRank />
              </p>
            )}
          </div>
        </div>
      </div>

      {programmer.image && (
        <Lightbox
          items={[{ url: programmer.image, caption: programmer.name }]}
          index={viewingPhoto ? 0 : null}
          onIndexChange={() => {}}
          onClose={() => setViewingPhoto(false)}
        />
      )}

      {handles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {handles.map(({ id, type, handle }) => (
            <Button key={`${type}-${id}`} variant="outline" size="sm" asChild>
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
          <div className="grid gap-5 sm:grid-cols-2">
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
                        {/* TrackerDetailPage selects the ranklist from the
                            `keyword` search param — there is no
                            `/trackers/:slug/:keyword` route, so a path segment
                            here falls through to the 404. */}
                        <Link
                          to={`/trackers/${entry.tracker.slug}?keyword=${encodeURIComponent(ranklist.keyword)}`}
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
