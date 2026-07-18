import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ReorderButtons({
  index,
  count,
  disabled = false,
  onMove,
}: {
  index: number
  count: number
  disabled?: boolean
  onMove: (from: number, to: number) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Move up"
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Move down"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ChevronDown />
      </Button>
    </div>
  )
}
