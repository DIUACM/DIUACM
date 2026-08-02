import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'

import { LessonPlayer } from './LessonPlayer'
import { courseSeconds, findCourse, playlistUrl, type Lesson } from './courses.data'
import { DataPanel } from '@/components/shared/DataPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

export function CourseDetailPage() {
  const { slug } = useParams()
  const course = findCourse(slug)
  const [searchParams, setSearchParams] = useSearchParams()

  useDocumentTitle(course?.title)

  if (!course) {
    return (
      <div>
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-muted/50 py-16 text-center shadow-clay-inset">
          <p className="text-sm text-muted-foreground">
            That course doesn&apos;t exist — it may have been renamed.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/courses">Browse all courses</Link>
          </Button>
        </div>
      </div>
    )
  }

  // The selected lesson lives in the URL so a specific class is linkable and the
  // back button steps through them. Anything out of range falls back to the first.
  const requested = Number(searchParams.get('lesson'))
  const current =
    course.lessons.find((lesson) => lesson.number === requested) ?? course.lessons[0]

  const selectLesson = (lesson: Lesson) => {
    setSearchParams(lesson.number === 1 ? {} : { lesson: String(lesson.number) })
  }

  return (
    <div>
      <BackLink />

      {/* One badge, one meta line, one paragraph. Lesson count and runtime read
          as supporting detail here rather than as four competing pills. */}
      <header className="mb-8 max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-balance sm:text-4xl">{course.title}</h1>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            Free
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {course.tagline} · {course.lessons.length} lessons ·{' '}
          {formatDuration(0, courseSeconds(course))}
        </p>
        <p className="mt-4 text-pretty text-muted-foreground">{course.description}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section>
          <LessonPlayer lesson={current} courseTitle={course.title} />

          <div className="mt-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Lesson {current.number} of {course.lessons.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-balance sm:text-2xl">
              {current.title}
            </h2>
            <p className="mt-2 max-w-xl text-pretty text-muted-foreground">{current.summary}</p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24">
          {/* Runtime is already in the header meta line, so this is a plain label. */}
          <h2 className="mb-3 text-sm font-semibold">Lessons</h2>

          <DataPanel className="overflow-x-visible">
            <ol className="divide-y divide-foreground/5">
              {course.lessons.map((lesson) => {
                const isCurrent = lesson.number === current.number

                return (
                  <li key={lesson.youtubeId} className="first:rounded-t-3xl last:rounded-b-3xl">
                    <button
                      type="button"
                      onClick={() => selectLesson(lesson)}
                      aria-current={isCurrent ? 'true' : undefined}
                      // Without this the computed name runs the number badge and
                      // the duration together ("04 Loops 1h 11m").
                      aria-label={`Lesson ${lesson.number}: ${lesson.title}`}
                      className={cn(
                        'flex w-full items-center gap-3 px-(--panel-inset) py-3 text-left transition-colors',
                        isCurrent ? 'text-primary' : 'hover:text-primary',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold',
                          isCurrent
                            ? 'bg-primary text-primary-foreground shadow-clay-sm'
                            : 'bg-muted text-muted-foreground shadow-clay-inset',
                        )}
                      >
                        {isCurrent ? (
                          <Play className="size-3.5 translate-x-px fill-current" />
                        ) : (
                          String(lesson.number).padStart(2, '0')
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-sm',
                            isCurrent ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {lesson.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDuration(0, lesson.durationSeconds)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </DataPanel>

          <p className="mt-4 text-xs text-muted-foreground">
            <a
              href={playlistUrl(course)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
            >
              Watch the full playlist on YouTube
              <ArrowUpRight className="size-3.5" />
            </a>
          </p>
        </aside>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
      <Link to="/courses">
        <ArrowLeft className="size-4" /> All courses
      </Link>
    </Button>
  )
}
