import { ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { IMAGE_ACCEPT, imageRejection } from '@/lib/image-file'
import { cn } from '@/lib/utils'

/**
 * Click-to-browse *and* drop target for image uploads. Rejected files are
 * reported here so every upload surface gives the same message, and only the
 * files that pass reach `onFiles` — a drop of five photos where one is a PDF
 * still uploads the other four.
 */
export function ImageDropzone({
  onFiles,
  multiple = false,
  busy = false,
  disabled = false,
  label,
  busyLabel = 'Uploading…',
  hint,
  className,
}: {
  onFiles: (files: File[]) => void
  multiple?: boolean
  busy?: boolean
  disabled?: boolean
  label: string
  busyLabel?: string
  hint?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Dragging over a child fires dragleave on the parent, so track depth rather
  // than a boolean or the highlight flickers across the inner text.
  const depth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const inert = disabled || busy

  const accept = (files: FileList | null) => {
    depth.current = 0
    setDragging(false)
    if (!files || files.length === 0) return
    const picked = multiple ? Array.from(files) : files[0] ? [files[0]] : []

    const rejections = picked.map(imageRejection)
    const valid = picked.filter((_, index) => rejections[index] === null)
    for (const rejection of rejections) {
      if (rejection) toast.error(rejection)
    }
    if (valid.length > 0) onFiles(valid)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        disabled={inert}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          depth.current += 1
          if (!inert) setDragging(true)
        }}
        onDragOver={(event) => {
          // Without this the browser navigates to the dropped file instead.
          event.preventDefault()
          event.dataTransfer.dropEffect = inert ? 'none' : 'copy'
        }}
        onDragLeave={() => {
          depth.current -= 1
          if (depth.current <= 0) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          if (inert) return
          accept(event.dataTransfer.files)
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm transition-colors',
          'hover:border-primary/40 hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-60',
          dragging && 'border-primary bg-primary/10',
        )}
      >
        <span className="flex items-center gap-2 font-medium">
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {busy ? busyLabel : label}
        </span>
        <span className="text-xs text-muted-foreground">
          {hint ?? `Drop ${multiple ? 'images' : 'an image'} here, or click to browse`}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          accept(event.target.files)
          // Let the same file be picked twice in a row (e.g. after a failure).
          event.target.value = ''
        }}
      />
    </div>
  )
}
