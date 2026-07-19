import { ArrowLeft, GripVertical, ImagePlus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddGalleryMedia,
  useAdminDeleteGalleryAlbum,
  useAdminGalleryAlbum,
  useAdminRemoveGalleryMedia,
  useAdminReorderGalleryMedia,
  useAdminUpdateGalleryAlbum,
} from '@/api/queries/admin-gallery'
import type { AdminGalleryAlbumDetail } from '@/api/queries/admin-gallery'
import type { PublishStatus } from '@/api/queries/admin-events'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { SortableGrid, SortableGridItem } from '@/features/admin/shared/SortableGrid'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useDocumentTitle } from '@/lib/use-document-title'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function AlbumEditForm({ album }: { album: AdminGalleryAlbumDetail }) {
  const updateAlbum = useAdminUpdateGalleryAlbum(album.id)
  const [form, setForm] = useState({
    title: album.title,
    slug: album.slug,
    description: album.description,
    status: album.status,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateAlbum.mutate(
      {
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        status: form.status,
      },
      {
        onSuccess: () => toast.success('Album updated.'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ga-title">Title</Label>
          <Input
            id="ga-title"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ga-slug">Slug</Label>
          <Input
            id="ga-slug"
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: event.target.value }))
            }
            pattern="[a-z0-9-]+"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ga-description">Description</Label>
        <Textarea
          id="ga-description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as PublishStatus }))
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={updateAlbum.isPending}>
        {updateAlbum.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

function PhotoManager({ album }: { album: AdminGalleryAlbumDetail }) {
  const addMedia = useAdminAddGalleryMedia(album.id)
  const removeMedia = useAdminRemoveGalleryMedia(album.id)
  const reorderMedia = useAdminReorderGalleryMedia(album.id)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Use a PNG, JPEG, GIF, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }
    addMedia.mutate(file, {
      onSuccess: () => toast.success('Photo added.'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const movePhoto = (from: number, to: number) => {
    const rows = [...album.media]
    const [moved] = rows.splice(from, 1)
    rows.splice(to, 0, moved)
    reorderMedia.mutate(
      rows.map((item, index) => ({ id: item.id, order: index })),
      { onError: (error) => toast.error(errorMessage(error)) },
    )
  }

  return (
    <div className="space-y-4">
      {album.media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag photos to reorder — the first one is the album cover.
          </p>
          <SortableGrid
            ids={album.media.map((item) => item.id)}
            disabled={reorderMedia.isPending}
            onMove={movePhoto}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {album.media.map(
              (item) =>
                item.url && (
                  <SortableGridItem
                    key={item.id}
                    id={item.id}
                    disabled={reorderMedia.isPending}
                    className="group relative overflow-hidden rounded-lg border"
                  >
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <GripVertical className="size-4" />
                    </span>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      // Pointer-down would otherwise start a drag instead of a click.
                      onPointerDown={(event) => event.stopPropagation()}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() =>
                        removeMedia.mutate(item.id, {
                          onSuccess: () => toast.success('Photo removed.'),
                          onError: (error) => toast.error(errorMessage(error)),
                        })
                      }
                    >
                      <X className="size-4" />
                    </button>
                  </SortableGridItem>
                ),
            )}
          </SortableGrid>
        </>
      )}
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={addMedia.isPending}
      >
        <ImagePlus className="size-4" />
        {addMedia.isPending ? 'Uploading…' : 'Add photo'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export function AdminGalleryAlbumDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const albumQuery = useAdminGalleryAlbum(id)
  const deleteAlbum = useAdminDeleteGalleryAlbum()
  useDocumentTitle(
    albumQuery.data ? `Admin · ${albumQuery.data.title}` : 'Admin · Album',
  )

  if (albumQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
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
          <Link to="/admin/gallery">
            <ArrowLeft className="size-4" /> All albums
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
              {album.title}
              <StatusBadge status={album.status} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              /{album.slug} ·{' '}
              <Link to={`/gallery/${album.slug}`} className="hover:underline">
                view public page
              </Link>
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" /> Delete album
              </Button>
            }
            title={`Delete “${album.title}”?`}
            description="This permanently removes the album and all of its photos."
            onConfirm={() =>
              deleteAlbum.mutate(id, {
                onSuccess: () => {
                  toast.success('Album deleted.')
                  navigate('/admin/gallery')
                },
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Keyed by id, not updatedAt: a refetch after any mutation would
              otherwise remount the form and discard in-progress edits. */}
          <AlbumEditForm key={album.id} album={album} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos ({album.media.length})</CardTitle>
          <CardDescription>
            The first photo becomes the album cover on the public gallery page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoManager album={album} />
        </CardContent>
      </Card>
    </div>
  )
}
