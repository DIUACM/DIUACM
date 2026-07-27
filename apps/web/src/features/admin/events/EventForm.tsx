import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  CONTEST_KIND_LABELS,
  CONTEST_PLATFORM_LABELS,
  EVENT_TYPE_LABELS,
  SCOPE_LABELS,
} from '@/lib/constants'
import { detectContestLink } from '@diuacm/contest-link'
import { epochToLocalInput, localInputToEpoch } from '@/lib/datetime'
import type { AdminEventDetail, AdminEventInput } from '@/api/queries/admin-events'
import type { EventType, ParticipationScope } from '@/api/types'

interface EventFormProps {
  initial?: AdminEventDetail
  submitLabel: string
  isPending: boolean
  onSubmit: (input: AdminEventInput) => void
}

export function EventForm({ initial, submitLabel, isPending, onSubmit }: EventFormProps) {
  const now = Math.floor(Date.now() / 1000)
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    type: initial?.type ?? ('contest' as EventType),
    status: initial?.status ?? ('draft' as 'draft' | 'published'),
    startingAt: epochToLocalInput(initial?.startingAt ?? now + 3600),
    endingAt: epochToLocalInput(initial?.endingAt ?? now + 3600 * 3),
    eventLink: initial?.eventLink ?? '',
    eventPassword: initial?.eventPassword ?? '',
    participationScope:
      initial?.participationScope ?? ('open_for_all' as ParticipationScope),
    openForAttendance: initial?.openForAttendance ?? false,
    strictAttendance: initial?.strictAttendance ?? false,
  })

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Contests are the only type we can resolve a judge/contest id for.
  const showContestHint = form.type === 'contest' && form.eventLink.trim() !== ''
  const contest = showContestHint ? detectContestLink(form.eventLink) : null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit({
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      status: form.status,
      startingAt: localInputToEpoch(form.startingAt),
      endingAt: localInputToEpoch(form.endingAt),
      eventLink: form.eventLink.trim() === '' ? null : form.eventLink.trim(),
      eventPassword: form.eventPassword === '' ? null : form.eventPassword,
      participationScope: form.participationScope,
      openForAttendance: form.openForAttendance,
      strictAttendance: form.strictAttendance,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="e-title">Title</Label>
        <Input
          id="e-title"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="e-description">Description</Label>
        <Textarea
          id="e-description"
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          rows={4}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(value) => set('type', value as EventType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => set('status', value as 'draft' | 'published')}
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
        <div className="space-y-2">
          <Label>Participation</Label>
          <Select
            value={form.participationScope}
            onValueChange={(value) =>
              set('participationScope', value as ParticipationScope)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="e-start">Starts</Label>
          <Input
            id="e-start"
            type="datetime-local"
            value={form.startingAt}
            onChange={(event) => set('startingAt', event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-end">Ends</Label>
          <Input
            id="e-end"
            type="datetime-local"
            value={form.endingAt}
            onChange={(event) => set('endingAt', event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-link">Event link</Label>
          <Input
            id="e-link"
            type="url"
            value={form.eventLink}
            onChange={(event) => set('eventLink', event.target.value)}
            placeholder="https://…"
          />
          {showContestHint &&
            (contest ? (
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">
                  {CONTEST_PLATFORM_LABELS[contest.platform]}
                </Badge>
                <span>{CONTEST_KIND_LABELS[contest.kind]} ID</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  {contest.contestId}
                </span>
                {contest.platform === 'codeforces' && contest.kind !== 'contest' && (
                  <span>— private to Codeforces, solve counts are not synced automatically.</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No contest detected — supported: Codeforces, VJudge, AtCoder.
              </p>
            ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-password">Event password</Label>
          <Input
            id="e-password"
            value={form.eventPassword}
            onChange={(event) => set('eventPassword', event.target.value)}
            placeholder="For attendance"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
        <div className="flex items-center gap-2">
          <Switch
            id="e-attendance"
            checked={form.openForAttendance}
            onCheckedChange={(checked) => set('openForAttendance', checked)}
          />
          <Label htmlFor="e-attendance" className="font-normal">
            Open for attendance
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="e-strict"
            checked={form.strictAttendance}
            onCheckedChange={(checked) => set('strictAttendance', checked)}
          />
          <Label htmlFor="e-strict" className="font-normal">
            Strict attendance
          </Label>
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
