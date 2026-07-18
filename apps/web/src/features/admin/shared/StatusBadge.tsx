import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: 'published' | 'draft' }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === 'published'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      )}
    >
      {status === 'published' ? 'Published' : 'Draft'}
    </Badge>
  )
}
