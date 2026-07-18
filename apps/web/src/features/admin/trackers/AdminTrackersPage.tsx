import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminCreateTracker,
  useAdminReorderTrackers,
  useAdminTrackers,
} from '@/api/queries/admin-trackers'
import type { PublishStatus } from '@/api/queries/admin-events'
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ReorderButtons } from '@/features/admin/shared/ReorderButtons'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

const ALL = 'all'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function CreateTrackerDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createTracker = useAdminCreateTracker()
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft' as PublishStatus,
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createTracker.mutate(
      {
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        status: form.status,
      },
      {
        onSuccess: (tracker) => {
          toast.success('Tracker created.')
          setOpen(false)
          navigate(`/admin/trackers/${tracker.id}`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New tracker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create tracker</DialogTitle>
          <DialogDescription>
            A tracker groups ranklists, e.g. one per season.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
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
            <Label htmlFor="t-slug">Slug</Label>
            <Input
              id="t-slug"
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
            <Label htmlFor="t-description">Description</Label>
            <Textarea
              id="t-description"
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTracker.isPending}>
              {createTracker.isPending ? 'Creating…' : 'Create tracker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTrackersPage() {
  useDocumentTitle('Admin · Trackers')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as PublishStatus | null) ?? undefined

  const trackersQuery = useAdminTrackers({ page, q, status })
  const reorderTrackers = useAdminReorderTrackers()
  // Reordering a filtered subset would scramble the global order, so only
  // allow it on the unfiltered list.
  const canReorder = !q && !status

  const moveTracker = (from: number, to: number) => {
    if (!trackersQuery.data) return
    const rows = [...trackersQuery.data.data]
    const [moved] = rows.splice(from, 1)
    rows.splice(to, 0, moved)
    const base = (trackersQuery.data.meta.page - 1) * trackersQuery.data.meta.perPage
    reorderTrackers.mutate(
      rows.map((tracker, index) => ({ id: tracker.id, position: base + index })),
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

  return (
    <div>
      <PageHeader title="Trackers" description="All trackers, including drafts.">
        <CreateTrackerDialog />
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search trackers…"
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

      {trackersQuery.isPending ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : trackersQuery.isError ? (
        <ErrorState
          error={trackersQuery.error}
          onRetry={() => void trackersQuery.refetch()}
        />
      ) : trackersQuery.data.data.length === 0 ? (
        <EmptyState message="No trackers match your filters." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 pl-4">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackersQuery.data.data.map((tracker, index) => (
                  <TableRow key={tracker.id}>
                    <TableCell className="pl-4">
                      <ReorderButtons
                        index={index}
                        count={trackersQuery.data.data.length}
                        disabled={!canReorder || reorderTrackers.isPending}
                        onMove={moveTracker}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/trackers/${tracker.id}`}
                        className="font-medium hover:underline"
                      >
                        {tracker.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tracker.slug}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tracker.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {formatDate(tracker.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            meta={trackersQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
