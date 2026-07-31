import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminBulkGalleryAlbums,
  useAdminCreateGalleryAlbum,
  useAdminGalleryAlbums,
  useAdminReorderGalleryAlbums,
} from '@/api/queries/admin-gallery'
import type { PublishStatus } from '@/api/queries/admin-events'
import type { BulkPublishAction } from '@/api/types'
import { DataPanel } from '@/components/shared/DataPanel'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { SortableRow, SortableRows } from '@/features/admin/shared/SortableRows'
import {
  PublishBulkBar,
  RowCheckbox,
  SelectAllHead,
} from '@/features/admin/shared/BulkBar'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

const ALL = 'all'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function CreateAlbumDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createAlbum = useAdminCreateGalleryAlbum()
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft' as PublishStatus,
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createAlbum.mutate(
      {
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        status: form.status,
      },
      {
        onSuccess: (album) => {
          toast.success('Album created.')
          setOpen(false)
          navigate(`/admin/gallery/${album.id}`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New album
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create album</DialogTitle>
          <DialogDescription>
            An album groups photos, e.g. one per event or trip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-title">Title</Label>
            <Input
              id="g-title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                  slug: slugTouched ? prev.slug : slugify(event.target.value),
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-slug">Slug</Label>
            <Input
              id="g-slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }}
              pattern="[a-z0-9-]+"
              placeholder="lowercase-with-dashes"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-description">Description</Label>
            <Textarea
              id="g-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as PublishStatus }))
              }
            >
              <SelectTrigger id="g-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createAlbum.isPending}>
              {createAlbum.isPending ? 'Creating…' : 'Create album'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminGalleryPage() {
  useDocumentTitle('Admin · Gallery')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as PublishStatus | null) ?? undefined

  const albumsQuery = useAdminGalleryAlbums({ page, q, status })
  const reorderAlbums = useAdminReorderGalleryAlbums()
  const bulkAlbums = useAdminBulkGalleryAlbums()
  const selection = useRowSelection(
    (albumsQuery.data?.data ?? []).map((album) => album.id),
  )
  // Reordering a filtered subset would scramble the global order, so only
  // allow it on the unfiltered list.
  const canReorder = !q && !status

  const moveAlbum = (from: number, to: number) => {
    if (!albumsQuery.data) return
    const rows = [...albumsQuery.data.data]
    const [moved] = rows.splice(from, 1)
    rows.splice(to, 0, moved)
    const base = (albumsQuery.data.meta.page - 1) * albumsQuery.data.meta.perPage
    reorderAlbums.mutate(
      rows.map((album, index) => ({ id: album.id, order: base + index })),
      { onError: (error) => toast.error(errorMessage(error)) },
    )
  }

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const runBulk = (action: BulkPublishAction) => {
    bulkAlbums.mutate(
      { ids: selection.selected, action },
      {
        onSuccess: ({ affected }) => {
          selection.clear()
          const result =
            action === 'publish'
              ? 'published'
              : action === 'draft'
                ? 'moved to drafts'
                : 'deleted'
          toast.success(`${affected} album${affected === 1 ? '' : 's'} ${result}.`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div>
      <PageHeader title="Gallery" description="All albums, including drafts.">
        <CreateAlbumDialog />
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search albums…"
          className="flex-1"
        />
        <Select
          value={status ?? ALL}
          onValueChange={(value) => updateParams({ status: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {albumsQuery.isPending ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : albumsQuery.isError ? (
        <ErrorState
          error={albumsQuery.error}
          onRetry={() => void albumsQuery.refetch()}
        />
      ) : albumsQuery.data.data.length === 0 ? (
        <EmptyState message="No albums match your filters." />
      ) : (
        <div className="space-y-4">
          <PublishBulkBar
            selection={selection}
            itemLabel="album"
            isPending={bulkAlbums.isPending}
            onAction={runBulk}
          />
          <DataPanel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <SelectAllHead
                    selection={selection}
                    label="Select all albums"
                    className="w-10"
                  />
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Photos</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <SortableRows
                ids={albumsQuery.data.data.map((album) => album.id)}
                disabled={!canReorder || reorderAlbums.isPending}
                onMove={moveAlbum}
              >
                {albumsQuery.data.data.map((album) => (
                  <SortableRow key={album.id} id={album.id}>
                    <TableCell>
                      <RowCheckbox
                        selection={selection}
                        id={album.id}
                        label={`Select ${album.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/gallery/${album.id}`}
                        className="font-medium hover:underline"
                      >
                        {album.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {album.slug}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={album.status} />
                    </TableCell>
                    <TableCell className="text-center">{album.mediaCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(album.updatedAt)}
                    </TableCell>
                  </SortableRow>
                ))}
              </SortableRows>
            </Table>
          </DataPanel>
          <Pagination
            meta={albumsQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
