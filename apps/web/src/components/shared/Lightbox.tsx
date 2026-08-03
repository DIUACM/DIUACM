import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { ResponsiveImage } from './ResponsiveImage'

export interface LightboxItem {
  url: string
  caption?: string | null
}

/**
 * Full-bleed image viewer. Built on the dialog primitive rather than
 * `DialogContent` so the image sizes itself against the viewport instead of
 * sitting in a centred card, but it still inherits the focus trap, the Esc
 * handler and the scroll lock.
 *
 * `index === null` means closed; the parent owns that state so the grid can
 * open straight to the photo that was clicked.
 */
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const open = index !== null
  const count = items.length

  // Wrapping keeps the arrows live at both ends, which matches how the
  // keyboard shortcuts behave in every other gallery.
  const step = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return
      onIndexChange((index + delta + count) % count)
    },
    [count, index, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, step])

  const current = index === null ? null : items[index]
  if (!current) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-label="Photo viewer"
          // The image itself is inside, so the default "return focus to
          // trigger" behaviour is all we need; suppress the auto-focus ring
          // landing on the close button.
          className="fixed inset-0 z-50 flex flex-col outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">
            {current.caption || `Photo ${(index ?? 0) + 1} of ${count}`}
          </DialogPrimitive.Title>

          <div className="flex items-center justify-between gap-2 p-3 text-white">
            {/* A lone image needs no "1 / 1". */}
            {count > 1 ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">
                {(index ?? 0) + 1} / {count}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:bg-white/15 hover:text-white"
              >
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open full size"
                >
                  <Download />
                </a>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="text-white hover:bg-white/15 hover:text-white"
                >
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Clicking the backdrop around the image closes; the image itself
              stops the event so a mis-drag on the photo doesn't dismiss it. */}
          <DialogPrimitive.Close
            className="relative flex min-h-0 flex-1 cursor-zoom-out items-center justify-center p-3 outline-none sm:p-6"
            aria-label="Close"
            tabIndex={-1}
          >
            <ResponsiveImage
              src={current.url}
              preset="lightbox"
              alt={current.caption ?? ''}
              loading="eager"
              fetchPriority="high"
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full cursor-default rounded-2xl object-contain shadow-2xl"
            />
          </DialogPrimitive.Close>

          {count > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Previous photo"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:left-4"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Next photo"
                onClick={() => step(1)}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:right-4"
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          )}

          {current.caption && (
            <p className="mx-auto max-w-3xl px-4 pb-4 text-center text-sm text-white/80">
              {current.caption}
            </p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
