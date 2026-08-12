import type { HandlesMap } from '@/api/types'
import { HANDLE_LABELS, HANDLE_TYPES, handleProfileUrl } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ProgrammerHandles({
  handles,
  compact = false,
  className,
}: {
  handles: HandlesMap
  compact?: boolean
  className?: string
}) {
  const linkedPlatforms = HANDLE_TYPES.filter((type) => handles[type].length > 0)

  if (linkedPlatforms.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>None linked</p>
  }

  return (
    <div className={cn(compact ? 'space-y-1 text-xs' : 'grid gap-3 sm:grid-cols-3', className)}>
      {linkedPlatforms.map((type) => (
        <div key={type} className={cn(!compact && 'space-y-1')}>
          <p className={cn('font-medium', compact ? 'text-muted-foreground' : 'text-sm')}>
            {HANDLE_LABELS[type]}
          </p>
          <div className={cn('flex flex-wrap', compact ? 'gap-x-1.5' : 'gap-x-2 gap-y-1')}>
            {handles[type].map(({ id, handle }) => (
              <a
                key={id}
                href={handleProfileUrl(type, handle)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary hover:underline"
                aria-label={`${HANDLE_LABELS[type]} profile for ${handle}`}
              >
                {handle}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
