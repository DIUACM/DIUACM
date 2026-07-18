import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS, SCOPE_LABELS } from '@/lib/constants'
import { eventTiming } from '@/lib/datetime'
import type { EventListItem } from '@/api/types'
import { cn } from '@/lib/utils'

export function EventTypeBadge({ type }: { type: EventListItem['type'] }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        type === 'contest' &&
          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        type === 'class' &&
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      )}
    >
      {EVENT_TYPE_LABELS[type]}
    </Badge>
  )
}

export function EventTimingBadge({
  startingAt,
  endingAt,
}: {
  startingAt: number
  endingAt: number
}) {
  const timing = eventTiming(startingAt, endingAt)
  if (timing === 'ended') return null
  return (
    <Badge
      className={cn(
        timing === 'ongoing' &&
          'bg-green-600 text-white dark:bg-green-500 dark:text-green-950',
        timing === 'upcoming' &&
          'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
      )}
    >
      {timing === 'ongoing' ? 'Live now' : 'Upcoming'}
    </Badge>
  )
}

export function ScopeBadge({ scope }: { scope: EventListItem['participationScope'] }) {
  if (scope === 'open_for_all') return null
  return <Badge variant="outline">{SCOPE_LABELS[scope]}</Badge>
}
