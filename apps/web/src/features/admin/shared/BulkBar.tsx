import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableHead } from '@/components/ui/table'
import type { BulkPublishAction } from '@/api/types'
import { ConfirmDialog } from './ConfirmDialog'
import type { RowSelection } from './use-row-selection'

/** Header checkbox: ticks every rendered row, dashed while partly selected. */
export function SelectAllCheckbox({
  selection,
  label,
  className,
}: {
  selection: RowSelection
  label: string
  className?: string
}) {
  return (
    <Checkbox
      className={className}
      aria-label={label}
      checked={
        selection.allSelected ? true : selection.someSelected ? 'indeterminate' : false
      }
      onCheckedChange={(checked) => selection.toggleAll(checked === true)}
    />
  )
}

/**
 * `<TableHead>` wrapper for the selection column. Defaults to leading-column
 * padding; pass `className="w-10"` when a drag handle comes first.
 */
export function SelectAllHead({
  selection,
  label,
  className = 'w-10 pl-4',
}: {
  selection: RowSelection
  label: string
  className?: string
}) {
  return (
    <TableHead className={className}>
      <SelectAllCheckbox selection={selection} label={label} />
    </TableHead>
  )
}

export function RowCheckbox({
  selection,
  id,
  label,
}: {
  selection: RowSelection
  id: number
  label: string
}) {
  return (
    <Checkbox
      aria-label={label}
      checked={selection.isSelected(id)}
      onCheckedChange={(checked) => selection.toggle(id, checked === true)}
    />
  )
}

/**
 * Toolbar shown above a table once rows are selected. Actions go in as
 * children; a Clear button is appended.
 */
export function BulkBar({
  selection,
  children,
}: {
  selection: RowSelection
  children: React.ReactNode
}) {
  if (selection.count === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium">
        {selection.count} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={selection.clear}>
          Clear
        </Button>
      </div>
    </div>
  )
}

export function PublishBulkBar({
  selection,
  itemLabel,
  itemLabelPlural = `${itemLabel}s`,
  isPending,
  onAction,
}: {
  selection: RowSelection
  itemLabel: string
  itemLabelPlural?: string
  isPending: boolean
  onAction: (action: BulkPublishAction) => void
}) {
  const items =
    selection.count === 1
      ? `1 ${itemLabel}`
      : `${selection.count} ${itemLabelPlural}`

  return (
    <BulkBar selection={selection}>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => onAction('publish')}
      >
        Publish
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => onAction('draft')}
      >
        Move to drafts
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" size="sm" disabled={isPending}>
            Delete
          </Button>
        }
        title={`Delete ${items}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => onAction('delete')}
      />
    </BulkBar>
  )
}
