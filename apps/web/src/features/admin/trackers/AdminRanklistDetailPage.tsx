import { ArrowLeft, Check, Lock, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddRanklistUser,
  useAdminBulkRanklistEvents,
  useAdminBulkRemoveRanklistUsers,
  useAdminDeleteRanklist,
  useAdminRanklist,
  useAdminRemoveRanklistEvent,
  useAdminRemoveRanklistUser,
  useAdminSetRanklistEvent,
  useAdminUpdateRanklist,
  type AdminRanklistDetail,
} from '@/api/queries/admin-trackers'
import type { PublishStatus } from '@/api/queries/admin-events'
import { BulkBar, RowCheckbox, SelectAllHead } from '@/features/admin/shared/BulkBar'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { EventPicker } from '@/features/admin/shared/EventPicker'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { UserPicker } from '@/features/admin/shared/UserPicker'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { DataPanel } from '@/components/shared/DataPanel'
import { UserAvatar } from '@/components/shared/UserAvatar'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

function RanklistEditForm({ ranklist }: { ranklist: AdminRanklistDetail }) {
  const updateRanklist = useAdminUpdateRanklist(ranklist.id)
  const [form, setForm] = useState({
    keyword: ranklist.keyword,
    description: ranklist.description,
    status: ranklist.status,
    upsolveWeight: String(ranklist.upsolveWeight),
    isLocked: ranklist.isLocked,
    considerStrictAttendance: ranklist.considerStrictAttendance,
    autoAddUsers: ranklist.autoAddUsers,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateRanklist.mutate(
      {
        keyword: form.keyword,
        description: form.description,
        status: form.status,
        upsolveWeight: Number(form.upsolveWeight) || 0,
        isLocked: form.isLocked,
        considerStrictAttendance: form.considerStrictAttendance,
        autoAddUsers: form.autoAddUsers,
      },
      {
        onSuccess: () => toast.success('Ranklist updated. Scores recalculated.'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="rl-keyword">Keyword</Label>
          <Input
            id="rl-keyword"
            value={form.keyword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, keyword: event.target.value }))
            }
            pattern="[a-zA-Z0-9_-]+"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rl-weight">Upsolve weight (0–1)</Label>
          <Input
            id="rl-weight"
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="rl-description">Description</Label>
        <Textarea
          id="rl-description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="rl-locked"
            checked={form.isLocked}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isLocked: checked }))
            }
          />
          <Label htmlFor="rl-locked" className="font-normal">
            Locked
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="rl-strict"
            checked={form.considerStrictAttendance}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, considerStrictAttendance: checked }))
            }
          />
          <Label htmlFor="rl-strict" className="font-normal">
            Consider strict attendance
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="rl-auto-add"
            checked={form.autoAddUsers}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, autoAddUsers: checked }))
            }
          />
          <Label htmlFor="rl-auto-add" className="font-normal">
            Auto add users
          </Label>
        </div>
      </div>
      <Button type="submit" disabled={updateRanklist.isPending}>
        {updateRanklist.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

function WeightCell({
  ranklistId,
  eventId,
  weight,
}: {
  ranklistId: number
  eventId: number
  weight: number
}) {
  const [value, setValue] = useState(String(weight))
  const setEvent = useAdminSetRanklistEvent(ranklistId)
  const dirty = Number(value) !== weight

  const save = () => {
    if (!dirty || setEvent.isPending) return
    setEvent.mutate(
      { eventId, weight: Number(value) || 0 },
      {
        onSuccess: () => toast.success('Weight updated. Scores recalculated.'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Input
        type="number"
        min={0}
        max={1}
        step="0.05"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save()
        }}
        className="h-8 w-20"
        aria-label="Event weight"
      />
      {dirty && (
        <Button
          size="icon"
          className="size-8"
          aria-label="Save weight"
          disabled={setEvent.isPending}
          onClick={save}
        >
          <Check className="size-4" />
        </Button>
      )}
    </div>
  )
}

export function AdminRanklistDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'participants' ? 'participants' : 'events'
  const ranklistQuery = useAdminRanklist(id)
  const deleteRanklist = useAdminDeleteRanklist()
  const setEvent = useAdminSetRanklistEvent(id)
  const removeEvent = useAdminRemoveRanklistEvent(id)
  const addUser = useAdminAddRanklistUser(id)
  const removeUser = useAdminRemoveRanklistUser(id)

  const bulkEvents = useAdminBulkRanklistEvents(id)
  const bulkRemoveUsers = useAdminBulkRemoveRanklistUsers(id)
  const eventSelection = useRowSelection(
    (ranklistQuery.data?.events ?? []).map((event) => event.id),
  )
  const userSelection = useRowSelection(
    (ranklistQuery.data?.users ?? []).map((standing) => standing.user.id),
  )
  const [bulkWeight, setBulkWeight] = useState('1')

  useDocumentTitle(
    ranklistQuery.data
      ? `Admin · ${ranklistQuery.data.keyword}`
      : 'Admin · Ranklist',
  )

  if (ranklistQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (ranklistQuery.isError) {
    return (
      <ErrorState
        error={ranklistQuery.error}
        onRetry={() => void ranklistQuery.refetch()}
      />
    )
  }

  const ranklist = ranklistQuery.data

  const runEventBulk = (action: 'detach' | 'set-weight', weight?: number) => {
    bulkEvents.mutate(
      { ids: eventSelection.selected, action, weight },
      {
        onSuccess: ({ affected }) => {
          eventSelection.clear()
          toast.success(
            action === 'detach'
              ? `${affected} event${affected === 1 ? '' : 's'} detached.`
              : `Weight set on ${affected} event${affected === 1 ? '' : 's'}. Scores recalculated.`,
          )
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to={`/admin/trackers/${ranklist.trackerId}`}>
            <ArrowLeft className="size-4" /> Back to tracker
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
            {ranklist.keyword}
            <StatusBadge status={ranklist.status} />
            {ranklist.isLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" /> Locked
              </Badge>
            )}
          </h1>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" /> Delete ranklist
              </Button>
            }
            title={`Delete “${ranklist.keyword}”?`}
            description="This permanently removes the ranklist, its event links, and user memberships."
            onConfirm={() =>
              deleteRanklist.mutate(id, {
                onSuccess: () => {
                  toast.success('Ranklist deleted.')
                  navigate(`/admin/trackers/${ranklist.trackerId}`)
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
          <CardDescription>
            Changing the upsolve weight recalculates every score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RanklistEditForm key={ranklist.updatedAt} ranklist={ranklist} />
        </CardContent>
      </Card>

      <Card>
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                if (value === 'events') next.delete('tab')
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
              <TabsTrigger value="events">
                Events ({ranklist.events.length})
              </TabsTrigger>
              <TabsTrigger value="participants">
                Participants ({ranklist.users.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="events" className="space-y-4">
              <CardDescription>
                Attach events and set their weight in the standings.
              </CardDescription>
              <EventPicker
                placeholder="Attach an event…"
                onSelect={(event) =>
                  setEvent.mutate(
                    { eventId: event.id, weight: 1 },
                    {
                      onSuccess: () => toast.success(`“${event.title}” attached.`),
                      onError: (error) => toast.error(errorMessage(error)),
                    },
                  )
                }
              />
              {ranklist.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events attached.</p>
              ) : (
                <div className="space-y-3">
                  <BulkBar selection={eventSelection}>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step="0.05"
                        value={bulkWeight}
                        onChange={(event) => setBulkWeight(event.target.value)}
                        className="h-8 w-20"
                        aria-label="Weight for selected events"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={bulkEvents.isPending}
                        onClick={() => runEventBulk('set-weight', Number(bulkWeight) || 0)}
                      >
                        Set weight
                      </Button>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="sm" disabled={bulkEvents.isPending}>
                          <Trash2 className="size-4" /> Detach
                        </Button>
                      }
                      title={`Detach ${eventSelection.count} event${eventSelection.count === 1 ? '' : 's'}?`}
                      description="The events stay, but drop out of this ranklist's standings."
                      confirmLabel="Detach"
                      onConfirm={() => runEventBulk('detach')}
                    />
                  </BulkBar>
                  <DataPanel>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SelectAllHead
                            selection={eventSelection}
                            label="Select all events"
                          />
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Weight</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranklist.events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <RowCheckbox
                                selection={eventSelection}
                                id={event.id}
                                label={`Select ${event.title}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Link
                                to={`/admin/events/${event.id}`}
                                className="font-medium hover:underline"
                              >
                                {event.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(event.startingAt)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={event.status} />
                            </TableCell>
                            <TableCell>
                              <WeightCell
                                key={`${event.id}-${event.weight}`}
                                ranklistId={id}
                                eventId={event.id}
                                weight={event.weight}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                aria-label={`Detach ${event.title}`}
                                onClick={() =>
                                  removeEvent.mutate(event.id, {
                                    onSuccess: () => toast.success('Event detached.'),
                                    onError: (error) =>
                                      toast.error(errorMessage(error)),
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
                  </DataPanel>
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants" className="space-y-4">
              <CardDescription>
                Users ranked in this ranklist. Adding is idempotent; adding an
                “auto” member makes them manual, so auto-removal skips them.
              </CardDescription>
              <UserPicker
                placeholder="Add a participant…"
                onSelect={(user) =>
                  addUser.mutate(user.id, {
                    onSuccess: () => toast.success(`${user.name} added.`),
                    onError: (error) => toast.error(errorMessage(error)),
                  })
                }
              />
              {ranklist.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet.</p>
              ) : (
                <div className="space-y-3">
                  <BulkBar selection={userSelection}>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={bulkRemoveUsers.isPending}
                        >
                          <Trash2 className="size-4" /> Remove
                        </Button>
                      }
                      title={`Remove ${userSelection.count} participant${userSelection.count === 1 ? '' : 's'}?`}
                      description="Their event data remains, but they will no longer appear in this ranklist."
                      confirmLabel="Remove"
                      onConfirm={() =>
                        bulkRemoveUsers.mutate(userSelection.selected, {
                          onSuccess: ({ affected }) => {
                            userSelection.clear()
                            toast.success(
                              `${affected} participant${affected === 1 ? '' : 's'} removed.`,
                            )
                          },
                          onError: (error) => toast.error(errorMessage(error)),
                        })
                      }
                    />
                  </BulkBar>
                  <DataPanel>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SelectAllHead
                            selection={userSelection}
                            label="Select all participants"
                          />
                          <TableHead className="w-16 text-center">Rank</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranklist.users.map((standing) => (
                          <TableRow key={standing.user.id}>
                            <TableCell>
                              <RowCheckbox
                                selection={userSelection}
                                id={standing.user.id}
                                label={`Select ${standing.user.name}`}
                              />
                            </TableCell>
                            <TableCell className="text-center font-semibold text-muted-foreground">
                              {standing.rank}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <UserAvatar
                                  name={standing.user.name}
                                  image={standing.user.image}
                                  className="size-7"
                                />
                                <span className="font-medium">
                                  {standing.user.name}
                                </span>
                                <span className="text-muted-foreground">
                                  @{standing.user.username}
                                </span>
                                {standing.autoAdded && (
                                  <Badge variant="secondary">auto</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {standing.score.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                aria-label={`Remove ${standing.user.name}`}
                                onClick={() =>
                                  removeUser.mutate(standing.user.id, {
                                    onSuccess: () =>
                                      toast.success('Participant removed.'),
                                    onError: (error) =>
                                      toast.error(errorMessage(error)),
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
                  </DataPanel>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
