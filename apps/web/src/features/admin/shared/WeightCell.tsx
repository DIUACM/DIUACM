import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Inline 0–1 weight editor for one ranklist ↔ event link. The save button only
 * appears once the value differs from the stored one; remount it with a key
 * that includes the weight so a saved value re-seeds the input.
 */
export function WeightCell({
  weight,
  isPending,
  onSave,
}: {
  weight: number
  isPending: boolean
  onSave: (weight: number) => void
}) {
  const [value, setValue] = useState(String(weight))
  const dirty = Number(value) !== weight

  const save = () => {
    if (!dirty || isPending) return
    onSave(Number(value) || 0)
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Input
        type="number"
        min={0}
        max={1}
        step="0.05"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save()
        }}
        className="h-8 w-20"
        aria-label="Event weight"
      />
      {dirty && (
        <Button
          size="icon"
          className="size-8"
          aria-label="Save weight"
          disabled={isPending}
          onClick={save}
        >
          <Check className="size-4" />
        </Button>
      )}
    </div>
  )
}
