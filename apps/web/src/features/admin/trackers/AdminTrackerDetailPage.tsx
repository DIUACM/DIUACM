import { ArrowLeft, Lock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminCreateRanklist,
  useAdminDeleteTracker,
  useAdminTracker,
  useAdminUpdateTracker,
} from '@/api/queries/admin-trackers'
import type { PublishStatus } from '@/api/queries/admin-events'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { useDocumentTitle } from '@/lib/use-document-title'
import type { AdminTrackerDetail } from '@/api/queries/admin-trackers'

function TrackerEditForm({ tracker }: { tracker: AdminTrackerDetail }) {
  const updateTracker = useAdminUpdateTracker(tracker.id)
  const [form, setForm] = useState({
    title: tracker.title,
    slug: tracker.slug,
    description: tracker.description,
    status: tracker.status,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateTracker.mutate(
      {
        title: form.title.trim(),
        slug: form.slug,
        description: form.description,
        status: form.status,
      },
      {
        onSuccess: () => toast.success('Tracker updated.'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tr-title">Title</Label>
          <Input
            id="tr-title"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-slug">Slug</Label>
          <Input
            id="tr-slug"
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
        <Label htmlFor="tr-description">Description</Label>
        <Textarea
          id="tr-description"
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
      <Button type="submit" disabled={updateTracker.isPending}>
        {updateTracker.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

function CreateRanklistDialog({ trackerId }: { trackerId: number }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createRanklist = useAdminCreateRanklist(trackerId)
  const [form, setForm] = useState({
    keyword: '',
    description: '',
    upsolveWeight: '0.25',
    status: 'draft' as PublishStatus,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createRanklist.mutate(
      {
        keyword: form.keyword,
        description: form.description,
        status: form.status,
        upsolveWeight: Number(form.upsolveWeight) || 0,
      },
      {
        onSuccess: (ranklist) => {
          toast.success('Ranklist created.')
          setOpen(false)
          navigate(`/admin/ranklists/${ranklist.id}`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New ranklist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create ranklist</DialogTitle>
          <DialogDescription>
            e.g. a season keyword like “2026-2027”.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-keyword">Keyword</Label>
              <Input
                id="r-keyword"
                value={form.keyword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, keyword: event.target.value }))
                }
                pattern="[a-zA-Z0-9_-]+"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-weight">Upsolve weight</Label>
              <Input
                id="r-weight"
                type="number"
                min={0}
                max={1}
                step="0.05"
                value={form.upsolveWeight}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, upsolveWeight: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-description">Description</Label>
            <Textarea
              id="r-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={2}
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
            <Button type="submit" disabled={createRanklist.isPending}>
              {createRanklist.isPending ? 'Creating…' : 'Create ranklist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTrackerDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const trackerQuery = useAdminTracker(id)
  const deleteTracker = useAdminDeleteTracker()
  useDocumentTitle(
    trackerQuery.data ? `Admin · ${trackerQuery.data.title}` : 'Admin · Tracker',
  )

  if (trackerQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (trackerQuery.isError) {
    return (
      <ErrorState
        error={trackerQuery.error}
        onRetry={() => void trackerQuery.refetch()}
      />
    )
  }

  const tracker = trackerQuery.data

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/admin/trackers">
            <ArrowLeft className="size-4" /> All trackers
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
              {tracker.title}
              <StatusBadge status={tracker.status} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              /{tracker.slug} ·{' '}
              <Link to={`/trackers/${tracker.slug}`} className="hover:underline">
                view public page
              </Link>
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" /> Delete tracker
              </Button>
            }
            title={`Delete “${tracker.title}”?`}
            description="This permanently removes the tracker and all of its ranklists."
            onConfirm={() =>
              deleteTracker.mutate(id, {
                onSuccess: () => {
                  toast.success('Tracker deleted.')
                  navigate('/admin/trackers')
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
          <TrackerEditForm key={tracker.updatedAt} tracker={tracker} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Ranklists</CardTitle>
            <CardDescription>
              Seasons or divisions within this tracker.
            </CardDescription>
          </div>
          <CreateRanklistDialog trackerId={id} />
        </CardHeader>
        <CardContent>
          {tracker.ranklists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ranklists yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Keyword</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Events</TableHead>
                    <TableHead className="pr-4 text-center">Upsolve wt.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracker.ranklists.map((ranklist) => (
                    <TableRow key={ranklist.id}>
                      <TableCell className="pl-4">
                        <Link
                          to={`/admin/ranklists/${ranklist.id}`}
                          className="flex items-center gap-2 font-medium hover:underline"
                        >
                          {ranklist.keyword}
                          {ranklist.isLocked && (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="size-3" /> Locked
                            </Badge>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ranklist.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {ranklist.userCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {ranklist.eventCount}
                      </TableCell>
                      <TableCell className="pr-4 text-center">
                        {ranklist.upsolveWeight}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
