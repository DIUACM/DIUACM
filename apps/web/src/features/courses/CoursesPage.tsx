import { GraduationCap, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { COURSES, courseSeconds, lessonThumbnail, type Course } from './courses.data'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDuration } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

export function CoursesPage() {
  useDocumentTitle('Courses')

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Free, self-paced video courses built from DIU ACM's recorded class series. No sign-up, no fees — just press play."
      />

      {COURSES.length === 0 ? (
        <EmptyState message="No courses published yet." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <Link
              key={course.slug}
              to={`/courses/${course.slug}`}
              className="group clay-lift-trigger block"
            >
              <Card className="clay-lift h-full overflow-hidden py-0">
                <CourseThumbnail course={course} />
                <CardContent className="flex flex-col gap-2 pb-5">
                  <h2 className="text-lg font-semibold transition-colors group-hover:text-primary">
                    {course.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{course.tagline}</p>
                  <p className="text-sm text-muted-foreground">
                    {course.lessons.length} lessons · {formatDuration(0, courseSeconds(course))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseThumbnail({ course }: { course: Course }) {
  const [failed, setFailed] = useState(false)
  const [firstLesson] = course.lessons

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      {failed || !firstLesson ? (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-chart-2/20">
          <GraduationCap className="size-8 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={lessonThumbnail(firstLesson)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
      )}
      <Badge className="absolute top-3 left-3 gap-1 bg-card/95 text-foreground shadow-clay-sm ring-1 ring-foreground/10">
        <PlayCircle className="size-3.5" />
        Free
      </Badge>
    </div>
  )
}
