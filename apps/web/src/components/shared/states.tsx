import { CircleAlert, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/api/client'

export function EmptyState({ message }: { message: string }) {
  return (
    // Carved rather than raised: an empty state is a hole in the page, so the
    // pressed inset says "nothing here" before you read the copy.
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-muted/50 py-16 text-center shadow-clay-inset">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-clay-sm">
        <Inbox className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-destructive/5 py-16 text-center shadow-clay-inset dark:bg-destructive/10">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-card text-destructive shadow-clay-sm">
        <CircleAlert className="size-6" />
      </span>
      <p className="max-w-md px-6 text-sm text-muted-foreground">
        {errorMessage(error)}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
