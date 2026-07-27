import { ArrowLeft, ImagePlus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddAttendance,
  useAdminAddEventMedia,
  useAdminBulkRemoveEventMedia,
  useAdminBulkRemoveAttendance,
  useAdminBulkRemovePerformance,
  useAdminDeleteEvent,
  useAdminEvent,
  useAdminRemoveAttendance,
  useAdminRemoveEventMedia,
  useAdminRemovePerformance,
  useAdminSetPerformance,
  useAdminUpdateEvent,
} from '@/api/queries/admin-events'
import { useEvent, useEventAttendance, useEventPerformance } from '@/api/queries/events'
import {
  BulkBar,
  RowCheckbox,
  SelectAllCheckbox,
  SelectAllHead,
} from '@/features/admin/shared/BulkBar'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { UserPicker } from '@/features/admin/shared/UserPicker'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { UserAvatar } from '@/components/shared/UserAvatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { hasPermission } from '@/lib/constants'
import { formatDateTime } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { UserSummary } from '@/api/types'
import { EventForm } from './EventForm'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function MediaManager({ eventId }: { eventId: number }) {
  const eventQuery = useAdminEvent(eventId)
  const addMedia = useAdminAddEventMedia(eventId)
  const removeMedia = useAdminRemoveEventMedia(eventId)
  const bulkRemoveMedia = useAdminBulkRemoveEventMedia(eventId)
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
      onSuccess: () => toast.success('Image added.'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const media = eventQuery.data?.media ?? []
  const selection = useRowSelection(media.map((item) => item.id))

  return (
    <div className="space-y-4">
      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm">
              <SelectAllCheckbox
                selection={selection}
                label="Select all event images"
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
              title={`Remove ${selection.count} image${selection.count === 1 ? '' : 's'}?`}
              description="The selected files will be permanently removed from this event."
              confirmLabel="Remove"
              onConfirm={() =>
                bulkRemoveMedia.mutate(selection.selected, {
                  onSuccess: ({ affected }) => {
                    selection.clear()
                    toast.success(
                      `${affected} image${affected === 1 ? '' : 's'} removed.`,
                    )
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          </BulkBar>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {media.map(
              (item) =>
                item.url && (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg border"
                  >
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 p-1">
                      <RowCheckbox
                        selection={selection}
                        id={item.id}
                        label="Select image"
                      />
                    </span>
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() =>
                        removeMedia.mutate(item.id, {
                          onSuccess: () => toast.success('Image removed.'),
                          onError: (error) => toast.error(errorMessage(error)),
                        })
                      }
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ),
            )}
          </div>
        </div>
      )}
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={addMedia.isPending}
      >
        <ImagePlus className="size-4" />
        {addMedia.isPending ? 'Uploading…' : 'Add image'}
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

function AttendanceManager({ eventId }: { eventId: number }) {
  const attendanceQuery = useEventAttendance(eventId)
  const addAttendance = useAdminAddAttendance(eventId)
  const removeAttendance = useAdminRemoveAttendance(eventId)
  const bulkRemoveAttendance = useAdminBulkRemoveAttendance(eventId)
  const selection = useRowSelection(
    (attendanceQuery.data?.data ?? []).flatMap((attendance) =>
      attendance.user ? [attendance.user.id] : [],
    ),
  )

  return (
    <div className="space-y-4">
      <UserPicker
        placeholder="Add attendee by name or username…"
        onSelect={(user) =>
          addAttendance.mutate(user.id, {
            onSuccess: () => toast.success(`${user.name} marked present.`),
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
      {attendanceQuery.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : attendanceQuery.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(attendanceQuery.error)}
        </p>
      ) : attendanceQuery.data.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attendees yet.</p>
      ) : (
        <div className="space-y-3">
          <BulkBar selection={selection}>
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={bulkRemoveAttendance.isPending}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              }
              title={`Remove ${selection.count} attendance record${selection.count === 1 ? '' : 's'}?`}
              description="The selected users will no longer be marked present for this event."
              confirmLabel="Remove"
              onConfirm={() =>
                bulkRemoveAttendance.mutate(selection.selected, {
                  onSuccess: ({ affected }) => {
                    selection.clear()
                    toast.success(
                      `${affected} attendance record${affected === 1 ? '' : 's'} removed.`,
                    )
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          </BulkBar>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SelectAllHead
                    selection={selection}
                    label="Select all attendance records"
                  />
                  <TableHead>Attendee</TableHead>
                  <TableHead>Marked present</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceQuery.data.data.map(
                  (attendance) =>
                    attendance.user && (
                      <TableRow key={attendance.user.id}>
                        <TableCell className="pl-4">
                          <RowCheckbox
                            selection={selection}
                            id={attendance.user.id}
                            label={`Select ${attendance.user.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              name={attendance.user.name}
                              image={attendance.user.image}
                              className="size-7"
                            />
                            <span className="font-medium">
                              {attendance.user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(attendance.attendedAt)}
                        </TableCell>
                        <TableCell className="pr-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            aria-label={`Remove ${attendance.user.name}`}
                            onClick={() =>
                              removeAttendance.mutate(attendance.user!.id, {
                                onSuccess: () =>
                                  toast.success('Attendance removed.'),
                                onError: (error) =>
                                  toast.error(errorMessage(error)),
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function PerformanceManager({ eventId }: { eventId: number }) {
  const performanceQuery = useEventPerformance(eventId)
  const setPerformance = useAdminSetPerformance(eventId)
  const removePerformance = useAdminRemovePerformance(eventId)
  const bulkRemovePerformance = useAdminBulkRemovePerformance(eventId)
  const selection = useRowSelection(
    (performanceQuery.data?.data ?? []).map((row) => row.user.id),
  )

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [position, setPosition] = useState('')
  const [solveCount, setSolveCount] = useState('0')
  const [upsolveCount, setUpsolveCount] = useState('0')

  const submitRow = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedUser) return
    setPerformance.mutate(
      {
        userId: selectedUser.id,
        position: position.trim() === '' ? null : Number(position),
        solveCount: Number(solveCount) || 0,
        upsolveCount: Number(upsolveCount) || 0,
      },
      {
        onSuccess: () => {
          toast.success(`Performance saved for ${selectedUser.name}.`)
          setSelectedUser(null)
          setPosition('')
          setSolveCount('0')
          setUpsolveCount('0')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div className="space-y-4">
      {selectedUser ? (
        <form
          onSubmit={submitRow}
          className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center gap-2">
            <UserAvatar
              name={selectedUser.name}
              image={selectedUser.image}
              className="size-7"
            />
            <span className="font-medium">{selectedUser.name}</span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="perf-position" className="text-xs">
              Position
            </Label>
            <Input
              id="perf-position"
              type="number"
              min={1}
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="Unranked"
              className="h-8 w-24"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="perf-solves" className="text-xs">
              Solves
            </Label>
            <Input
              id="perf-solves"
              type="number"
              min={0}
              value={solveCount}
              onChange={(event) => setSolveCount(event.target.value)}
              className="h-8 w-20"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="perf-upsolves" className="text-xs">
              Upsolves
            </Label>
            <Input
              id="perf-upsolves"
              type="number"
              min={0}
              value={upsolveCount}
              onChange={(event) => setUpsolveCount(event.target.value)}
              className="h-8 w-20"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={setPerformance.isPending}>
              {setPerformance.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <UserPicker
          placeholder="Add or update a participant…"
          onSelect={setSelectedUser}
        />
      )}

      {performanceQuery.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : performanceQuery.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(performanceQuery.error)}
        </p>
      ) : performanceQuery.data.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No performance rows yet.
        </p>
      ) : (
        <div className="space-y-3">
          <BulkBar selection={selection}>
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={bulkRemovePerformance.isPending}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              }
              title={`Remove ${selection.count} performance row${selection.count === 1 ? '' : 's'}?`}
              description="This also recalculates any ranklists that use this event."
              confirmLabel="Remove"
              onConfirm={() =>
                bulkRemovePerformance.mutate(selection.selected, {
                  onSuccess: ({ affected }) => {
                    selection.clear()
                    toast.success(
                      `${affected} performance row${affected === 1 ? '' : 's'} removed.`,
                    )
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          </BulkBar>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SelectAllHead
                    selection={selection}
                    label="Select all performance rows"
                  />
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-center">Solves</TableHead>
                  <TableHead className="text-center">Upsolves</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceQuery.data.data.map((row) => (
                  <TableRow key={row.user.id}>
                    <TableCell className="pl-4">
                      <RowCheckbox
                        selection={selection}
                        id={row.user.id}
                        label={`Select ${row.user.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {row.position ?? '—'}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-2 hover:underline"
                        onClick={() => {
                          setSelectedUser(row.user)
                          setPosition(row.position?.toString() ?? '')
                          setSolveCount(String(row.solveCount))
                          setUpsolveCount(String(row.upsolveCount))
                        }}
                      >
                        <UserAvatar
                          name={row.user.name}
                          image={row.user.image}
                          className="size-6"
                        />
                        <span className="font-medium">{row.user.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">{row.solveCount}</TableCell>
                    <TableCell className="text-center">{row.upsolveCount}</TableCell>
                    <TableCell className="pr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        aria-label={`Remove ${row.user.name}'s row`}
                        onClick={() =>
                          removePerformance.mutate(row.user.id, {
                            onSuccess: () => toast.success('Row removed.'),
                            onError: (error) => toast.error(errorMessage(error)),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminEventDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const canManageEvents = hasPermission(user, 'manage_events')
  const canManageAttendance = hasPermission(user, 'manage_attendance')

  // Attendance-only admins read the public event; see AdminEventsPage.
  const adminQuery = useAdminEvent(id, canManageEvents)
  const publicQuery = useEvent(id, !canManageEvents)
  const eventQuery = canManageEvents ? adminQuery : publicQuery

  const tabs = [
    ...(canManageEvents ? ['media', 'performance'] : []),
    ...(canManageAttendance ? ['attendance'] : []),
  ]
  const requestedTab = searchParams.get('tab')
  const tab = requestedTab && tabs.includes(requestedTab) ? requestedTab : tabs[0]

  const updateEvent = useAdminUpdateEvent(id)
  const deleteEvent = useAdminDeleteEvent()
  useDocumentTitle(
    eventQuery.data ? `Admin · ${eventQuery.data.title}` : 'Admin · Event',
  )

  if (eventQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (eventQuery.isError) {
    return (
      <ErrorState
        error={eventQuery.error}
        onRetry={() => void eventQuery.refetch()}
      />
    )
  }

  const event = eventQuery.data

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/admin/events">
            <ArrowLeft className="size-4" /> All events
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
              {event.title}
              <StatusBadge status={event.status} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(event.startingAt)} ·{' '}
              <Link to={`/events/${event.id}`} className="hover:underline">
                view public page
              </Link>
            </p>
          </div>
          {canManageEvents && (
            <ConfirmDialog
              trigger={
                <Button variant="destructive">
                  <Trash2 className="size-4" /> Delete event
                </Button>
              }
              title={`Delete “${event.title}”?`}
              description="This permanently removes the event along with its media, attendance, performance rows, and ranklist links."
              onConfirm={() =>
                deleteEvent.mutate(id, {
                  onSuccess: () => {
                    toast.success('Event deleted.')
                    navigate('/admin/events')
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          )}
        </div>
      </div>

      {canManageEvents && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm
              key={event.updatedAt}
              initial={adminQuery.data}
              submitLabel="Save changes"
              isPending={updateEvent.isPending}
              onSubmit={(input) =>
                updateEvent.mutate(input, {
                  onSuccess: () => toast.success('Event updated.'),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            />
          </CardContent>
        </Card>
      )}

      {tabs.length > 0 && (
        <Card>
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev)
                  if (value === tabs[0]) next.delete('tab')
                  else next.set('tab', value)
                  return next
                },
                { replace: true },
              )
            }
            className="gap-4"
          >
            <CardHeader>
              <TabsList>
                {canManageEvents && (
                  <TabsTrigger value="media">
                    Media ({(adminQuery.data?.media ?? []).length})
                  </TabsTrigger>
                )}
                {canManageAttendance && (
                  <TabsTrigger value="attendance">
                    Attendance ({event.attendanceCount})
                  </TabsTrigger>
                )}
                {canManageEvents && (
                  <TabsTrigger value="performance">
                    Performance ({event.performanceCount})
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>
            <CardContent>
              {canManageEvents && (
                <TabsContent value="media" className="space-y-4">
                  <CardDescription>
                    Images shown on the public event page.
                  </CardDescription>
                  <MediaManager eventId={id} />
                </TabsContent>
              )}
              {canManageAttendance && (
                <TabsContent value="attendance" className="space-y-4">
                  <CardDescription>
                    Add or remove attendees without password or time-window
                    checks.
                  </CardDescription>
                  <AttendanceManager eventId={id} />
                </TabsContent>
              )}
              {canManageEvents && (
                <TabsContent value="performance" className="space-y-4">
                  <CardDescription>
                    Solve counts and standings for this event's leaderboard.
                  </CardDescription>
                  <PerformanceManager eventId={id} />
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}
