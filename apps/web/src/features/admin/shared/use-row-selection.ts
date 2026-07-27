import { useEffect, useState } from 'react'

export interface RowSelection {
  /** Selected ids that are still on screen, in render order. */
  selected: number[]
  count: number
  isSelected: (id: number) => boolean
  toggle: (id: number, checked: boolean) => void
  /** Selects or clears every row currently rendered. */
  toggleAll: (checked: boolean) => void
  clear: () => void
  allSelected: boolean
  someSelected: boolean
}

/**
 * Checkbox selection for an admin table.
 *
 * `ids` is whatever the table renders right now. Selection resets when that
 * rendered set changes, so a bulk action can only ever hit rows the admin can
 * currently see and stale picks cannot leak across pages or filters.
 */
export function useRowSelection(ids: number[]): RowSelection {
  const [picked, setPicked] = useState<ReadonlySet<number>>(() => new Set())
  const idsKey = ids.join(',')
  const selected = ids.filter((id) => picked.has(id))

  useEffect(() => {
    setPicked(new Set())
  }, [idsKey])

  return {
    selected,
    count: selected.length,
    isSelected: (id) => picked.has(id),
    toggle: (id, checked) =>
      setPicked((prev) => {
        const next = new Set(prev)
        if (checked) next.add(id)
        else next.delete(id)
        return next
      }),
    toggleAll: (checked) =>
      setPicked((prev) => {
        const next = new Set(prev)
        for (const id of ids) {
          if (checked) next.add(id)
          else next.delete(id)
        }
        return next
      }),
    clear: () => setPicked(new Set()),
    allSelected: ids.length > 0 && selected.length === ids.length,
    someSelected: selected.length > 0 && selected.length < ids.length,
  }
}
