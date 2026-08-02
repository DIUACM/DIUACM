import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'

import { lessonThumbnail, type Lesson } from './courses.data'
import { cn } from '@/lib/utils'

/**
 * A lesson video, embedded as a click-to-play facade: the poster frame is a
 * plain `<img>`, and YouTube's player iframe is only mounted once someone
 * presses play.
 *
 * The indirection is worth it. The embed pulls roughly a megabyte of
 * third-party JavaScript and sets cookies on load, which is a poor trade on a
 * page whose main content is a list of seven lessons — only one of which is
 * ever watched at a time. It also keeps the course page free of third-party
 * console noise, which the browser smoke tests assert on.
 */
export function LessonPlayer({ lesson, courseTitle }: { lesson: Lesson; courseTitle: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)

  // Switching lessons must drop back to the poster frame, otherwise the iframe
  // stays mounted and the previous lesson keeps playing under the new title.
  useEffect(() => {
    setIsPlaying(false)
    setThumbnailFailed(false)
  }, [lesson.youtubeId])

  const label = `Lesson ${lesson.number}: ${lesson.title} — ${courseTitle}`

  if (isPlaying) {
    return (
      <iframe
        // Remount per lesson so `autoplay` fires again rather than the browser
        // reusing the previous frame.
        key={lesson.youtubeId}
        src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
        title={label}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video w-full rounded-2xl bg-black shadow-clay"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`Play ${label}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {thumbnailFailed ? (
        <div className="size-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
      ) : (
        <img
          src={lessonThumbnail(lesson)}
          alt=""
          loading="lazy"
          // YouTube's image host needs no referrer, and withholding it keeps the
          // visitor's exact page out of a third party's logs.
          referrerPolicy="no-referrer"
          onError={() => setThumbnailFailed(true)}
          className="size-full object-cover transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none"
        />
      )}

      {/* Just enough scrim to keep the play button legible over a bright frame.
          The lesson title is not repeated here — it sits under the player. */}
      <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />

      <span
        className={cn(
          'absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
          'rounded-full bg-card/95 text-primary shadow-clay-lg ring-1 ring-foreground/10',
          'transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none',
        )}
      >
        {/* Nudged right so the triangle's visual centre matches the circle's. */}
        <Play className="size-7 translate-x-0.5 fill-current" />
      </span>
    </button>
  )
}
