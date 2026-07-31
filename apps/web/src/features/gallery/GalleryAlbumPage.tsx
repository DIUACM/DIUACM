import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useGalleryAlbum } from '@/api/queries/gallery'
import { Lightbox } from '@/components/shared/Lightbox'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

export function GalleryAlbumPage() {
  const params = useParams()
  const slug = params.slug ?? ''
  const albumQuery = useGalleryAlbum(slug)
  const [viewing, setViewing] = useState<number | null>(null)
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
  // The lightbox indexes into this list, so drop the media rows with no URL
  // rather than rendering holes the arrow keys would land on.
  const photos = album.media.flatMap((media) =>
    media.url ? [{ id: media.id, url: media.url }] : [],
  )

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

      {photos.length === 0 ? (
        <EmptyState message="This album has no photos yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewing(index)}
              aria-label={`View photo ${index + 1} of ${photos.length}`}
              className="group clay-lift-trigger block cursor-zoom-in rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="clay-lift overflow-hidden rounded-2xl shadow-clay ring-1 ring-foreground/5">
                <img
                  src={photo.url}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <Lightbox
        items={photos}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}
