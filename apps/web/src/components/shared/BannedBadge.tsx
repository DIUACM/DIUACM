import { Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

export function BannedBadge({
  reason,
  className,
}: {
  reason: string | null
  className?: string
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant="destructive"
          tabIndex={0}
          aria-label={`Banned${reason ? `: ${reason}` : ''}`}
          className={cn('cursor-help', className)}
        >
          <Ban data-icon="inline-start" />
          Banned
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 space-y-1.5">
        <p className="text-sm font-semibold text-destructive">Account banned</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {reason ?? 'No reason was provided.'}
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}
