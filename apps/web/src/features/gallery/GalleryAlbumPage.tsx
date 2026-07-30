import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useGalleryAlbum } from '@/api/queries/gallery'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

export function GalleryAlbumPage() {
  const params = useParams()
  const slug = params.slug ?? ''
  const albumQuery = useGalleryAlbum(slug)
  useDocumentTitle(albumQuery.data?.title)

  if (albumQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (albumQuery.isError) {
    return (
      <ErrorState
        error={albumQuery.error}
        onRetry={() => void albumQuery.refetch()}
      />
    )
  }

  const album = albumQuery.data

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/gallery">
            <ArrowLeft className="size-4" /> All albums
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">{album.title}</h1>
        {album.description && (
          <p className="mt-1.5 max-w-2xl whitespace-pre-line text-muted-foreground">
            {stripHtml(album.description)}
          </p>
        )}
      </div>

      {album.media.length === 0 ? (
        <EmptyState message="This album has no photos yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {album.media.map(
            (media) =>
              media.url && (
                <a
                  key={media.id}
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group clay-lift-trigger block"
                >
                  <div className="clay-lift overflow-hidden rounded-2xl shadow-clay ring-1 ring-foreground/5">
                    <img
                      src={media.url}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </a>
              ),
          )}
        </div>
      )}
    </div>
  )
}
