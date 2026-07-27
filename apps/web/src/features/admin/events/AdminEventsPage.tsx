import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminBulkEvents,
  useAdminCreateEvent,
  useAdminEvents,
  type PublishStatus,
} from '@/api/queries/admin-events'
import { useEvents } from '@/api/queries/events'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useAuth } from '@/features/auth/auth-context'
import {
  PublishBulkBar,
  RowCheckbox,
  SelectAllHead,
} from '@/features/admin/shared/BulkBar'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { EVENT_TYPE_LABELS, SCOPE_LABELS, hasPermission } from '@/lib/constants'
import { formatDateTime } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { BulkPublishAction, EventType, ParticipationScope } from '@/api/types'
import { EventForm } from './EventForm'

const ALL = 'all'

function CreateEventDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createEvent = useAdminCreateEvent()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Drafts stay hidden from the public site until published.
          </DialogDescription>
        </DialogHeader>
        <EventForm
          submitLabel="Create event"
          isPending={createEvent.isPending}
          onSubmit={(input) =>
            createEvent.mutate(input, {
              onSuccess: (event) => {
                toast.success('Event created.')
                setOpen(false)
                navigate(`/admin/events/${event.id}`)
              },
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}

export function AdminEventsPage() {
  useDocumentTitle('Admin · Events')
  const { user } = useAuth()
  const canManageEvents = hasPermission(user, 'manage_events')
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const type = (searchParams.get('type') as EventType | null) ?? undefined
  const scope = (searchParams.get('scope') as ParticipationScope | null) ?? undefined
  const status = (searchParams.get('status') as PublishStatus | null) ?? undefined

  // Attendance-only admins can't read /admin/events; fall back to the
  // public list (published events only) so they can still reach an event's
  // attendance manager.
  const adminQuery = useAdminEvents({ page, q, type, scope, status }, canManageEvents)
  const publicQuery = useEvents({ page, q, type, scope }, !canManageEvents)
  const eventsQuery = canManageEvents ? adminQuery : publicQuery
  const bulkEvents = useAdminBulkEvents()
  const selection = useRowSelection(
    (eventsQuery.data?.data ?? []).map((event) => event.id),
  )

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
    bulkEvents.mutate(
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
          toast.success(`${affected} event${affected === 1 ? '' : 's'} ${result}.`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description={
          canManageEvents
            ? 'All events, including drafts.'
            : 'Published events — you hold attendance access only.'
        }
      >
        {canManageEvents && <CreateEventDialog />}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search events…"
          className="flex-1"
        />
        <div className="flex gap-3">
          <Select
            value={type ?? ALL}
            onValueChange={(value) => updateParams({ type: value, page: undefined })}
          >
            <SelectTrigger className="flex-1 lg:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManageEvents && (
            <Select
              value={status ?? ALL}
              onValueChange={(value) =>
                updateParams({ status: value, page: undefined })
              }
            >
              <SelectTrigger className="flex-1 lg:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {eventsQuery.isPending ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : eventsQuery.isError ? (
        <ErrorState
          error={eventsQuery.error}
          onRetry={() => void eventsQuery.refetch()}
        />
      ) : eventsQuery.data.data.length === 0 ? (
        <EmptyState message="No events match your filters." />
      ) : (
        <div className="space-y-4">
          {canManageEvents && (
            <PublishBulkBar
              selection={selection}
              itemLabel="event"
              isPending={bulkEvents.isPending}
              onAction={runBulk}
            />
          )}
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  {canManageEvents && (
                    <SelectAllHead
                      selection={selection}
                      label="Select all events"
                    />
                  )}
                  <TableHead className={canManageEvents ? undefined : 'pl-4'}>
                    Title
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead className="pr-4">Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsQuery.data.data.map((event) => (
                  <TableRow key={event.id}>
                    {canManageEvents && (
                      <TableCell className="pl-4">
                        <RowCheckbox
                          selection={selection}
                          id={event.id}
                          label={`Select ${event.title}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className={canManageEvents ? undefined : 'pl-4'}>
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="font-medium hover:underline"
                      >
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {EVENT_TYPE_LABELS[event.type]}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(event.startingAt)}
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {SCOPE_LABELS[event.participationScope]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            meta={eventsQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
