import {
  Activity,
  BellOff,
  CircleAlert,
  CircleCheck,
  OctagonAlert,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useResolveNotice,
  useSystemHealth,
  useSystemRuns,
  type CronRun,
  type CronRunStatus,
  type SystemJob,
  type SystemNotice,
} from '@/api/queries/admin-system'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { formatDateTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/use-document-title'

const ALL = 'all'

// ---------------------------------------------------------------------------
// Run status is a *state*, so it uses the reserved status colours rather than a
// categorical palette, and never appears as colour alone: every strip carries a
// counted legend, every mark a tooltip, and the table below is the same data in
// text. Kept to the three the app already uses for published/draft/destructive
// so this page looks like the rest of the panel.
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  CronRunStatus,
  { label: string; icon: typeof CircleCheck; dot: string; text: string; badge: string }
> = {
  ok: {
    label: 'OK',
    icon: CircleCheck,
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  degraded: {
    label: 'Degraded',
    icon: TriangleAlert,
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  crashed: {
    label: 'Crashed',
    icon: OctagonAlert,
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
}

function StatusBadge({ status }: { status: CronRunStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge variant="secondary" className={cn('gap-1', meta.badge)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

/** "4m ago" / "2.1h ago" / "3d ago" — the same wording the digest mail uses. */
function ago(epochSeconds: number | null, now: number): string {
  if (epochSeconds === null) return 'never'
  const hours = (now - epochSeconds) / 3600
  if (hours < 1) return `${Math.max(0, Math.round(hours * 60))}m ago`
  if (hours < 48) return `${hours.toFixed(1)}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function duration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m`
}

// ---------------------------------------------------------------------------
// Job cards
// ---------------------------------------------------------------------------

/**
 * The last runs of one job, oldest to newest, one mark each. Uniform height on
 * purpose: this encodes state, and giving the bars a second meaning (rows
 * written) would make a quiet-but-healthy run look like a failing one.
 */
function RunStrip({ job, now }: { job: SystemJob; now: number }) {
  const counts = { ok: job.day.ok, degraded: job.day.degraded, crashed: job.day.crashed }

  if (job.recent.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[2px]" role="img" aria-label={`Recent ${job.job} runs`}>
        {job.recent.map((run) => (
          <span
            key={run.startedAt}
            className={cn('h-7 flex-1 rounded-sm', STATUS_META[run.status].dot)}
            title={
              `${formatDateTime(run.startedAt)}\n` +
              `${STATUS_META[run.status].label} · ${duration(run.durationMs)}` +
              (run.rowsWritten === null ? '' : `\n${run.rowsWritten} rows written`) +
              (run.errors ? `\n${run.errors} error(s)` : '')
            }
          />
        ))}
      </div>
      {/* Counted legend, so the strip is never read by colour alone. */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {(Object.keys(counts) as CronRunStatus[])
          .filter((status) => counts[status] > 0)
          .map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', STATUS_META[status].dot)} />
              {counts[status]} {STATUS_META[status].label.toLowerCase()}
            </span>
          ))}
        <span className="ml-auto">last {ago(job.lastRunAt, now)}</span>
      </div>
    </div>
  )
}

/**
 * Ticks seen against ticks expected — the one number on this page that can catch
 * a cron which has stopped firing, since a job that never runs produces no error
 * and no alert anywhere else.
 */
function TickMeter({ job, ready }: { job: SystemJob; ready: boolean }) {
  if (job.expected === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadence not countable from <code className="text-xs">{job.cron}</code>
      </p>
    )
  }

  const ratio = Math.min(1, job.observed / job.expected)
  const missing = ready && job.observed < Math.floor(job.expected * 0.8)

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">
          <span className={cn('font-semibold tabular-nums', missing && 'text-red-600 dark:text-red-400')}>
            {job.observed}
          </span>
          <span className="text-muted-foreground"> / {job.expected} ticks</span>
        </span>
        {missing && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <CircleAlert className="size-3" />
            {job.observed === 0 ? 'not firing' : 'missing ticks'}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', missing ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${Math.max(ratio * 100, job.observed > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  )
}

function JobCard({ job, now, ready }: { job: SystemJob; now: number; ready: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-mono text-base">{job.job}</CardTitle>
          {job.lastStatus ? <StatusBadge status={job.lastStatus} /> : null}
        </div>
        <code className="text-xs text-muted-foreground">{job.cron}</code>
      </CardHeader>
      <CardContent className="space-y-4">
        <TickMeter job={job} ready={ready} />
        <RunStrip job={job} now={now} />
        {job.lastFaults.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.lastFaults.map((fault) => (
              <code
                key={fault}
                className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-300"
              >
                {fault}
              </code>
            ))}
          </div>
        )}
        <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Rows / 24h</dt>
            <dd className="tabular-nums">{job.day.rowsWritten.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Errors / 24h</dt>
            <dd className={cn('tabular-nums', job.day.errors > 0 && 'text-amber-600 dark:text-amber-400')}>
              {job.day.errors.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Slowest</dt>
            <dd className="tabular-nums">{duration(job.day.slowestMs || null)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Open faults
// ---------------------------------------------------------------------------

function NoticeCard({ notice, now }: { notice: SystemNotice; now: number }) {
  const resolve = useResolveNotice()

  return (
    <Card className="border-amber-300 dark:border-amber-900">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-mono text-sm">{notice.key}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              First seen {ago(notice.firstSeenAt, now)} · last {ago(notice.lastSeenAt, now)}
              {notice.occurrences > 0 && ` · ${notice.occurrences} since the last alert`}
              {notice.lastSentAt === null
                ? ' · never mailed'
                : ` · mailed ${ago(notice.lastSentAt, now)}`}
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm">
                <BellOff className="size-4" /> Mark resolved
              </Button>
            }
            title="Mark this fault resolved?"
            description={
              'Clears the alert cooldown for this fault. If it happens again you will be ' +
              'mailed straight away rather than waiting out the hour. The runs that raised ' +
              'it stay in the history below.'
            }
            confirmLabel="Mark resolved"
            onConfirm={() =>
              resolve.mutate(notice.key, {
                onSuccess: () => toast.success('Fault cleared.'),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          />
        </div>
      </CardHeader>
      {notice.lastDetail && (
        <CardContent>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
            {notice.lastDetail}
          </pre>
        </CardContent>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Run history — also the text view of the strips above, so nothing on this page
// is readable only as colour.
// ---------------------------------------------------------------------------

function SummaryCell({ run }: { run: CronRun }) {
  const summary = run.summary as Record<string, unknown> | null
  if (!summary) return <span className="text-muted-foreground">—</span>

  const parts = Object.entries(summary)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)

  return (
    <span
      className="line-clamp-2 font-mono text-xs text-muted-foreground"
      title={JSON.stringify(summary, null, 2)}
    >
      {parts.length > 0 ? parts.join(' · ') : JSON.stringify(summary)}
    </span>
  )
}

function RunHistory({ jobNames }: { jobNames: string[] }) {
  const [page, setPage] = useState(1)
  const [job, setJob] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)

  const runs = useSystemRuns({
    page,
    job: job === ALL ? undefined : job,
    status: status === ALL ? undefined : (status as CronRunStatus),
  })

  const reset = (apply: () => void) => {
    apply()
    setPage(1)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Run history</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <Select value={job} onValueChange={(value) => reset(() => setJob(value))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All jobs</SelectItem>
              {jobNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => reset(() => setStatus(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
              <SelectItem value="crashed">Crashed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {runs.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : runs.isError ? (
        <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />
      ) : runs.data.data.length === 0 ? (
        <EmptyState message="No runs match these filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Took</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.data.data.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(run.startedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{run.job}</TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                      {run.faults.length > 0 && (
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {run.faults.join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {duration(run.durationMs)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.rowsWritten ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{run.errors ?? '—'}</TableCell>
                    <TableCell className="max-w-xs">
                      <SummaryCell run={run} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination meta={runs.data.meta} onPageChange={setPage} />
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

export function AdminSystemPage() {
  useDocumentTitle('System')
  const health = useSystemHealth()

  if (health.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="System" description="What the scheduled jobs have been doing." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (health.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="System" description="What the scheduled jobs have been doing." />
        <ErrorState error={health.error} onRetry={() => void health.refetch()} />
      </div>
    )
  }

  const { now, jobs, notices, livenessReady, retentionDays } = health.data

  return (
    <div className="space-y-8">
      <PageHeader
        title="System"
        description="What the scheduled jobs have been doing — and, more usefully, whether they ran at all."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
        >
          <RefreshCw className={cn('size-4', health.isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </PageHeader>

      {!livenessReady && (
        <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm">
          <Activity className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            Tick counts are still filling up. Until a full day of history exists they measure how
            long this page has been recording rather than whether a job is healthy, so the
            missed-tick warnings stay switched off.
          </p>
        </div>
      )}

      {notices.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Open faults{' '}
            <span className="text-sm font-normal text-muted-foreground">({notices.length})</span>
          </h2>
          <div className="space-y-3">
            {notices.map((notice) => (
              <NoticeCard key={notice.key} notice={notice} now={now} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.job} job={job} now={now} ready={livenessReady} />
          ))}
        </div>
      </section>

      <RunHistory jobNames={jobs.map((job) => job.job)} />

      <p className="text-xs text-muted-foreground">
        Runs are kept for {retentionDays} days and pruned on the daily digest tick.
      </p>
    </div>
  )
}
