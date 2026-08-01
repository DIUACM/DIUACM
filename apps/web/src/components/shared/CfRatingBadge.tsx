import { cfRatingTier } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface CfRatingBadgeProps {
  rating: number | null
  className?: string
  showRank?: boolean
}

/** Codeforces max rating colored by tier; renders nothing when unrated. */
export function CfRatingBadge({
  rating,
  className,
  showRank = false,
}: CfRatingBadgeProps) {
  if (rating === null) return null
  const tier = cfRatingTier(rating)
  return (
    <span
      title={tier.title}
      className={cn('font-semibold', tier.className, className)}
    >
      {showRank ? `${tier.title} · ${rating}` : rating}
    </span>
  )
}
