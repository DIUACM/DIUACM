import { RotateCw, TriangleAlert } from 'lucide-react'
import { Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/api/client'

/** A failed `import()` — the usual cause is a deploy replacing the chunk files
 * while the tab was open, so the old hashed filenames 404. Reloading picks up
 * the new build, which is why that's the primary action for this case. */
function isStaleChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    error.message,
  )
}

export function RouteError() {
  const error = useRouteError()
  const staleChunk = isStaleChunkError(error)

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-card px-6 py-20 text-center shadow-clay ring-1 ring-foreground/5">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-clay-sm">
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold">
        {staleChunk ? 'A new version is available' : 'Something went wrong'}
      </h1>
      <p className="text-pretty text-muted-foreground">
        {staleChunk
          ? 'This page was updated while you had it open. Reload to get the latest version.'
          : errorMessage(error)}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => window.location.reload()}>
          <RotateCw /> Reload
        </Button>
        {!staleChunk && (
          <Button size="lg" variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
