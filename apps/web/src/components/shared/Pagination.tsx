import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/api/types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

type PageItem = number | 'left-ellipsis' | 'right-ellipsis'

/** First and last page always visible, a window of ±1 around the current page,
 * ellipses in between. Short ranges render every page. */
function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const items: PageItem[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('left-ellipsis')
  for (let page = start; page <= end; page++) items.push(page)
  if (end < total - 1) items.push('right-ellipsis')
  items.push(total)
  return items
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{meta.total} total</p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pageItems(meta.page, meta.totalPages).map((item) =>
          typeof item === 'number' ? (
            <Button
              key={item}
              variant={item === meta.page ? 'default' : 'ghost'}
              size="icon"
              className="size-9"
              onClick={() => onPageChange(item)}
              aria-current={item === meta.page ? 'page' : undefined}
              aria-label={`Page ${item}`}
            >
              {item}
            </Button>
          ) : (
            <span
              key={item}
              aria-hidden
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  )
}
