import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Flag,
  LoaderCircle,
  Timer,
  WandSparkles,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { errorMessage } from '@/api/client'
import {
  useAdminContestDetails,
  type ContestMetadata,
} from '@/api/queries/admin-events'
import { Badge } from '@/components/ui/badge'
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
import { CONTEST_KIND_LABELS, CONTEST_PLATFORM_LABELS } from '@/lib/constants'
import { formatDateTime, formatDuration } from '@/lib/datetime'
import { detectContestLink } from '@diuacm/contest-link'

interface ContestQuickFillDialogProps {
  onInsert: (link: string, details: ContestMetadata) => void
}

export function ContestQuickFillDialog({ onInsert }: ContestQuickFillDialogProps) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [preview, setPreview] = useState<ContestMetadata | null>(null)
  const requestSequence = useRef(0)
  const contestDetails = useAdminContestDetails()
  const normalizedLink = link.trim()
  const detected = normalizedLink === '' ? null : detectContestLink(normalizedLink)

  const reset = () => {
    requestSequence.current += 1
    setLink('')
    setPreview(null)
    contestDetails.reset()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  const handleFetch = (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!detected || normalizedLink === '') return

    const requestId = ++requestSequence.current
    setPreview(null)
    contestDetails.mutate(normalizedLink, {
      onSuccess: (details) => {
        if (requestSequence.current === requestId) setPreview(details)
      },
    })
  }

  const handleInsert = () => {
    if (!preview) return
    onInsert(normalizedLink, preview)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <WandSparkles />
          Quick fill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleFetch} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Quick fill from contest</DialogTitle>
            <DialogDescription>
              Fetch contest details first, review the preview, then insert them into
              the event form.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="quick-fill-contest-link">Contest link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="quick-fill-contest-link"
                type="url"
                value={link}
                onChange={(event) => {
                  requestSequence.current += 1
                  setLink(event.target.value)
                  setPreview(null)
                  contestDetails.reset()
                }}
                placeholder="https://codeforces.com/contest/…"
                autoFocus
                required
                aria-describedby="quick-fill-contest-help"
              />
              <Button
                type="submit"
                variant="secondary"
                className="shrink-0"
                disabled={!detected || contestDetails.isPending}
              >
                {contestDetails.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <WandSparkles />
                )}
                {contestDetails.isPending ? 'Fetching…' : 'Fetch details'}
              </Button>
            </div>

            <div
              id="quick-fill-contest-help"
              className="flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              {detected ? (
                <>
                  <Badge variant="secondary">
                    {CONTEST_PLATFORM_LABELS[detected.platform]}
                  </Badge>
                  <span>{CONTEST_KIND_LABELS[detected.kind]} ID</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-foreground">
                    {detected.contestId}
                  </span>
                </>
              ) : (
                <span>Supports Codeforces, VJudge, and AtCoder contest links.</span>
              )}
            </div>

            {contestDetails.isError && (
              <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{errorMessage(contestDetails.error)}</span>
              </p>
            )}
          </div>

          {preview && (
            <div
              className="rounded-2xl bg-card p-4 shadow-clay ring-1 ring-foreground/5"
              role="status"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">
                  {CONTEST_PLATFORM_LABELS[preview.platform]}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Fetched
                </span>
              </div>

              <h3 className="mt-2 text-base leading-snug font-semibold text-balance">
                {preview.title}
              </h3>

              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Starts </span>
                  {formatDateTime(preview.startingAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="size-3.5 shrink-0" aria-hidden="true" />
                  {formatDuration(preview.startingAt, preview.endingAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="size-3.5 shrink-0" aria-hidden="true" />
                  Ends {formatDateTime(preview.endingAt)}
                </span>
              </div>

              {preview.description && (
                <p className="mt-3 max-h-20 overflow-y-auto whitespace-pre-wrap border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                  {preview.description}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!preview} onClick={handleInsert}>
              <CheckCircle2 />
              Insert into event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
