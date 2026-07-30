import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Controlled search box that debounces onChange by 300ms. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchInputProps) {
  const [text, setText] = useState(value)

  // Callers pass an inline arrow, so `onChange` is a new function on every
  // parent render. Holding it in a ref keeps it out of the timer effect's
  // deps — otherwise any unrelated re-render (a background refetch flipping
  // `isFetching`, say) would clear the pending timer and restart the 300ms,
  // and a user typing steadily could keep pushing the search out.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    setText(value)
  }, [value])

  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onChangeRef.current(text), 300)
    return () => clearTimeout(timer)
  }, [text, value])

  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
    </div>
  )
}
