import { Images } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useGalleryAlbums } from '@/api/queries/gallery'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/lib/use-document-title'
import { stripHtml } from '@/lib/utils'

export function GalleryPage() {
  useDocumentTitle('Gallery')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const albumsQuery = useGalleryAlbums(page)

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Photo albums from contests, classes, and community moments."
      />

      {albumsQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : albumsQuery.isError ? (
        <ErrorState
          error={albumsQuery.error}
          onRetry={() => void albumsQuery.refetch()}
        />
      ) : albumsQuery.data.data.length === 0 ? (
        <EmptyState message="No albums published yet." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albumsQuery.data.data.map((album) => (
              <Link key={album.slug} to={`/gallery/${album.slug}`} className="group block">
                <Card className="h-full overflow-hidden py-0 transition-colors group-hover:border-primary/40">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted">
                      <Images className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="flex flex-col gap-1 pb-5">
                    <h3 className="text-lg font-semibold group-hover:underline">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {stripHtml(album.description)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {album.mediaCount} {album.mediaCount === 1 ? 'photo' : 'photos'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            meta={albumsQuery.data.meta}
            onPageChange={(nextPage) =>
              setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  )
}
