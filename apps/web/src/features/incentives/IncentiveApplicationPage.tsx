import { CircleCheck, Info, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError, errorMessage } from '@/api/client'
import {
  useMyIncentiveApplication,
  useSubmitIncentiveApplication,
} from '@/api/queries/incentives'
import type {
  IncentiveApplication,
  IncentiveApplicationInput,
  IncentiveCourse,
} from '@/api/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

const EMPTY_COURSE: IncentiveCourse = {
  courseName: '',
  courseCode: '',
  teacherName: '',
  teacherInitial: '',
  section: '',
  teacherEmail: '',
  teacherPhone: '',
}

// Label and placeholder for every course field, in the order they're rendered.
const COURSE_FIELDS: { key: keyof IncentiveCourse; label: string; placeholder: string }[] = [
  { key: 'courseName', label: 'Course name', placeholder: 'Full name of the course' },
  { key: 'courseCode', label: 'Course code', placeholder: 'e.g. CSE101' },
  { key: 'teacherName', label: 'Teacher name', placeholder: 'Full name of the teacher' },
  { key: 'teacherInitial', label: 'Teacher initial', placeholder: 'e.g. ABC' },
  { key: 'section', label: 'Section', placeholder: 'e.g. A' },
  { key: 'teacherEmail', label: 'Teacher email', placeholder: 'e.g. abc@diu.edu.bd' },
  { key: 'teacherPhone', label: 'Teacher phone', placeholder: 'e.g. 017XXXXXXXX' },
]

type PersonalField = Exclude<keyof IncentiveApplicationInput, 'courses'>

const PERSONAL_FIELDS: {
  key: PersonalField
  label: string
  placeholder: string
  type?: string
}[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'Enter your full name' },
  { key: 'studentId', label: 'Student ID', placeholder: 'e.g. 201-15-13800' },
  { key: 'batch', label: 'Batch', placeholder: 'e.g. CSE 65' },
  { key: 'currentSemester', label: 'Current semester', placeholder: 'e.g. Fall 2025' },
  { key: 'phoneNumber', label: 'Phone number', placeholder: 'Your contact number', type: 'tel' },
]

const blankForm = (): IncentiveApplicationInput => ({
  fullName: '',
  studentId: '',
  batch: '',
  currentSemester: '',
  phoneNumber: '',
  courses: [{ ...EMPTY_COURSE }],
})

const formFrom = (application: IncentiveApplication): IncentiveApplicationInput => ({
  fullName: application.fullName,
  studentId: application.studentId,
  batch: application.batch,
  currentSemester: application.currentSemester,
  phoneNumber: application.phoneNumber,
  courses: application.courses.map((course) => ({ ...course })),
})

/** One read-only `label / value` pair in the submitted view. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

function SubmittedView({
  application,
  onEdit,
}: {
  application: IncentiveApplication
  onEdit: () => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-emerald-600 shadow-clay-sm dark:text-emerald-400">
            <CircleCheck className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Application submitted</p>
            <p className="text-sm text-muted-foreground">
              Last updated {formatDateTime(application.updatedAt)}.
            </p>
          </div>
          <Button variant="outline" className="ml-auto" onClick={onEdit}>
            Edit application
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Detail label="Full name" value={application.fullName} />
          <Detail label="Student ID" value={application.studentId} />
          <Detail label="Batch" value={application.batch} />
          <Detail label="Email" value={application.email} />
          <Detail label="Current semester" value={application.currentSemester} />
          <Detail label="Phone number" value={application.phoneNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses ({application.courses.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {application.courses.map((course, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl bg-muted/50 p-5 shadow-clay-inset"
            >
              <p className="font-semibold">Course {index + 1}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {COURSE_FIELDS.map((field) => (
                  <Detail key={field.key} label={field.label} value={course[field.key]} />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ApplicationForm({
  existing,
  email,
  onCancel,
}: {
  existing: IncentiveApplication | null
  email: string
  onCancel: (() => void) | null
}) {
  const [form, setForm] = useState<IncentiveApplicationInput>(() =>
    existing ? formFrom(existing) : blankForm(),
  )
  // Field-level messages from the API's `issues` array, keyed by the dotted
  // path it reports (e.g. "courses.0.teacherEmail"). Cleared on each submit.
  const [issues, setIssues] = useState<Record<string, string>>({})
  const submit = useSubmitIncentiveApplication()

  const setField = (key: PersonalField, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setCourseField = (index: number, key: keyof IncentiveCourse, value: string) =>
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === index ? { ...course, [key]: value } : course,
      ),
    }))

  const addCourse = () =>
    setForm((prev) => ({ ...prev, courses: [...prev.courses, { ...EMPTY_COURSE }] }))

  const removeCourse = (index: number) =>
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setIssues({})
    submit.mutate(form, {
      onSuccess: () => {
        toast.success('Application submitted!')
        onCancel?.()
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          setIssues(
            Object.fromEntries(
              error.issues.flatMap((issue) =>
                issue.field && issue.message ? [[issue.field, issue.message]] : [],
              ),
            ),
          )
        }
        toast.error(errorMessage(error))
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            Every field on this page is required. Your performance and
            participation data is taken from your DIU ACM profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {PERSONAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                value={form[field.key]}
                onChange={(event) => setField(field.key, event.target.value)}
                placeholder={field.placeholder}
                aria-invalid={Boolean(issues[field.key])}
                required
              />
              {issues[field.key] && (
                <p className="text-sm text-destructive">{issues[field.key]}</p>
              )}
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Taken from your account — it can&apos;t be changed here.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            Add every course you&apos;re applying for, with the teacher who runs it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.courses.map((course, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl bg-muted/50 p-5 shadow-clay-inset"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Course {index + 1}</p>
                {form.courses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCourse(index)}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {COURSE_FIELDS.map((field) => {
                  const id = `course-${index}-${field.key}`
                  const issue = issues[`courses.${index}.${field.key}`]
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={id}>{field.label}</Label>
                      <Input
                        id={id}
                        type={
                          field.key === 'teacherEmail'
                            ? 'email'
                            : field.key === 'teacherPhone'
                              ? 'tel'
                              : undefined
                        }
                        value={course[field.key]}
                        onChange={(event) =>
                          setCourseField(index, field.key, event.target.value)
                        }
                        placeholder={field.placeholder}
                        aria-invalid={Boolean(issue)}
                        required
                      />
                      {issue && <p className="text-sm text-destructive">{issue}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addCourse}>
            <Plus className="size-4" /> Add another course
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending
            ? 'Submitting…'
            : existing
              ? 'Save changes'
              : 'Submit application'}
        </Button>
      </div>
    </form>
  )
}

export function IncentiveApplicationPage() {
  useDocumentTitle('Incentive application')
  const { user } = useAuth()
  const applicationQuery = useMyIncentiveApplication()
  const [editing, setEditing] = useState(false)

  if (applicationQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (applicationQuery.isError) {
    return (
      <div>
        <PageHeader title="Incentive application" />
        <ErrorState
          error={applicationQuery.error}
          onRetry={() => void applicationQuery.refetch()}
        />
      </div>
    )
  }

  const application = applicationQuery.data.application
  const showForm = application === null || editing

  return (
    <div>
      <PageHeader
        title="Incentive application"
        description={
          showForm
            ? 'Tell us which courses you want the incentive for, and who teaches them.'
            : 'What you submitted. You can update it at any time.'
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-clay-sm">
              <Info className="size-5" />
            </span>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Double-check the teacher details — they are used to verify your claim.</li>
              <li>You have one application: submitting again replaces the previous one.</li>
              <li>Your contest performance is read from your DIU ACM profile.</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {showForm ? (
        <ApplicationForm
          // Remount when switching between a fresh and an existing application
          // so the form re-seeds from what's on the server.
          key={application?.updatedAt ?? 'new'}
          existing={application}
          email={user?.email ?? ''}
          onCancel={application ? () => setEditing(false) : null}
        />
      ) : (
        <SubmittedView application={application} onEdit={() => setEditing(true)} />
      )}
    </div>
  )
}
