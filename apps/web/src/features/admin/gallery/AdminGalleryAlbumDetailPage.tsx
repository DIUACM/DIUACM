import { ArrowLeft, GripVertical, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddGalleryMedia,
  useAdminBulkRemoveGalleryMedia,
  useAdminDeleteGalleryAlbum,
  useAdminGalleryAlbum,
  useAdminRemoveGalleryMedia,
  useAdminReorderGalleryMedia,
  useAdminUpdateGalleryAlbum,
} from '@/api/queries/admin-gallery'
import type { AdminGalleryAlbumDetail } from '@/api/queries/admin-gallery'
import type { PublishStatus } from '@/api/queries/admin-events'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BulkBar,
  RowCheckbox,
  SelectAllCheckbox,
} from '@/features/admin/shared/BulkBar'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { SortableGrid, SortableGridItem } from '@/features/admin/shared/SortableGrid'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
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
import { ImageDropzone } from '@/components/shared/ImageDropzone'
import { ResponsiveImage } from '@/components/shared/ResponsiveImage'
import { useDocumentTitle } from '@/lib/use-document-title'

function AlbumEditForm({ album }: { album: AdminGalleryAlbumDetail }) {
  const updateAlbum = useAdminUpdateGalleryAlbum(album.id)
  const loaded = {
    title: album.title,
    slug: album.slug,
    description: album.description,
    status: album.status,
  }
  const [form, setForm] = useState(loaded)
  // Last successfully persisted values. Comparing against these — rather than
  // the `album` prop — keeps the form clean straight after a save, without
  // waiting for the query to refetch.
  const [saved, setSaved] = useState(loaded)
  const isDirty =
    form.title !== saved.title ||
    form.slug !== saved.slug ||
    form.description !== saved.description ||
    form.status !== saved.status

  // Full page unloads (reload, close tab, external link) get the browser's
  // native prompt; in-app navigation is caught by the blocker below.
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const blocker = useBlocker(isDirty)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      title: form.title.trim(),
      slug: form.slug,
      description: form.description,
      status: form.status,
    }
    updateAlbum.mutate(payload, {
      onSuccess: () => {
        setSaved(payload)
        toast.success('Album updated.')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
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
        <Label htmlFor="ga-status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as PublishStatus }))
          }
        >
          <SelectTrigger id="ga-status" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateAlbum.isPending || !isDirty}>
          {updateAlbum.isPending ? 'Saving…' : 'Save changes'}
        </Button>
        {isDirty && (
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
        )}
      </div>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This album has edits that haven’t been saved. Leaving now discards them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function PhotoManager({ album }: { album: AdminGalleryAlbumDetail }) {
  const addMedia = useAdminAddGalleryMedia(album.id)
  const removeMedia = useAdminRemoveGalleryMedia(album.id)
  const bulkRemoveMedia = useAdminBulkRemoveGalleryMedia(album.id)
  const reorderMedia = useAdminReorderGalleryMedia(album.id)
  const selection = useRowSelection(album.media.map((item) => item.id))

  // Sequential rather than parallel: each upload invalidates the album, and the
  // server assigns `order` on insert, so a batch dropped together keeps the
  // order it was dropped in.
  const handleFiles = async (files: File[]) => {
    let added = 0
    for (const file of files) {
      try {
        await addMedia.mutateAsync(file)
        added += 1
      } catch (error) {
        toast.error(errorMessage(error))
        break
      }
    }
    if (added > 0) toast.success(`${added} photo${added === 1 ? '' : 's'} added.`)
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Drag photos to reorder — the first one is the album cover.
            </p>
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <SelectAllCheckbox
                selection={selection}
                label="Select all photos"
              />
              Select all
            </label>
          </div>
          <BulkBar selection={selection}>
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={bulkRemoveMedia.isPending}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              }
              title={`Remove ${selection.count} photo${selection.count === 1 ? '' : 's'}?`}
              description="The selected files will be permanently removed from this album."
              confirmLabel="Remove"
              onConfirm={() =>
                bulkRemoveMedia.mutate(selection.selected, {
                  onSuccess: ({ affected }) => {
                    selection.clear()
                    toast.success(
                      `${affected} photo${affected === 1 ? '' : 's'} removed.`,
                    )
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          </BulkBar>
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
                    className="group relative overflow-hidden rounded-2xl shadow-clay-sm ring-1 ring-foreground/5"
                  >
                    <ResponsiveImage
                      src={item.url}
                      preset="squareGrid"
                      alt=""
                      draggable={false}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <GripVertical className="size-4" />
                    </span>
                    <span
                      className="absolute bottom-1.5 left-1.5 rounded-xl bg-background/90 p-1 shadow-clay-sm"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <RowCheckbox
                        selection={selection}
                        id={item.id}
                        label="Select photo"
                      />
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
      <ImageDropzone
        multiple
        label="Add photos"
        busy={addMedia.isPending}
        onFiles={(files) => void handleFiles(files)}
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
