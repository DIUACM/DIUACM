import { cn } from '@/lib/utils'

/**
 * The clay surface a full-width list of records sits on — a `Table`, or a
 * plain `divide-y` list where a table would be overkill. It occupies the same
 * slot as `EmptyState`/`ErrorState` and the loading `Skeleton`, so all of them
 * share the `rounded-3xl` page-panel radius; anything smaller makes the corners
 * jump as a list loads or empties.
 *
 * The edge padding lives here rather than on individual cells so every panel
 * clears the corner radius by the same amount. `--panel-inset` exposes it to
 * non-table children.
 */
export function DataPanel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-3xl bg-card shadow-clay ring-1 ring-foreground/5 [--panel-inset:--spacing(5)]',
        '[&_td:first-child]:pl-(--panel-inset) [&_th:first-child]:pl-(--panel-inset) [&_td:last-child]:pr-(--panel-inset) [&_th:last-child]:pr-(--panel-inset)',
        className,
      )}
      {...props}
    />
  )
}
