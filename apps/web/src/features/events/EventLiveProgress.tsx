import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/datetime'

/**
 * How much of a running event has elapsed. Renders nothing outside the event's
 * window, so it also disappears on its own once the clock passes the end —
 * the page doesn't have to be re-entered for the bar to go away.
 */
export function EventLiveProgress({
  startingAt,
  endingAt,
}: {
  startingAt: number
  endingAt: number
}) {
  const [now, setNow] = useState(() => Date.now() / 1000)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000)
    return () => clearInterval(id)
  }, [])

  if (now < startingAt || now > endingAt) return null

  // A zero-length event would divide by zero; clamping the span to a second
  // just pins such an event at 100%.
  const total = Math.max(1, endingAt - startingAt)
  const percent = Math.min(100, ((now - startingAt) / total) * 100)

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-clay-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-600 dark:bg-green-500" />
          </span>
          Live now
        </span>
        <span className="text-muted-foreground tabular-nums">
          {formatCountdown(endingAt - now)} left
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Event progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted shadow-clay-inset"
      >
        <div
          className="h-full rounded-full bg-green-600 transition-[width] duration-1000 ease-linear dark:bg-green-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
