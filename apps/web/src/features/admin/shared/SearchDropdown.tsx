import { Popover as PopoverPrimitive } from 'radix-ui'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

/**
 * Debounced search input with a portaled results dropdown. The portal keeps
 * the list from being clipped by overflow-hidden ancestors (e.g. Card), and
 * the dropdown dismisses on Escape or clicking elsewhere.
 */
export function SearchDropdown({
  placeholder,
  children,
}: {
  placeholder?: string
  children: (query: string, close: () => void) => React.ReactNode
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const timerRef = useRef<number>(undefined)
  const anchorRef = useRef<HTMLInputElement>(null)

  const handleChange = (value: string) => {
    setQuery(value)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setDebounced(value.trim()), 300)
  }

  const close = () => {
    window.clearTimeout(timerRef.current)
    setQuery('')
    setDebounced('')
  }

  const open = debounced.length > 0

  return (
    <PopoverPrimitive.Root open={open}>
      <PopoverPrimitive.Anchor asChild>
        <Input
          ref={anchorRef}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
        />
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={close}
          onPointerDownOutside={(event) => {
            // Clicking back into the input shouldn't clear the search.
            if (!anchorRef.current?.contains(event.target as Node)) close()
          }}
          className="z-50 max-h-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          {open && children(debounced, close)}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
