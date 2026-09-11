import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useBlocker } from 'react-router'
import { toast } from 'sonner'
import { ApiError, errorMessage } from '@/api/client'
import {
  type AdminIncentiveApplicationUpdateInput,
  useAdminUpdateIncentiveApplication,
} from '@/api/queries/admin-incentives'
import type { AdminIncentiveApplication, IncentiveCourse } from '@/api/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

const EMPTY_COURSE: IncentiveCourse = {
  courseName: '',
  courseCode: '',
  teacherName: '',
  teacherInitial: '',
  section: '',
  teacherEmail: '',
  teacherPhone: '',
}

const PERSONAL_FIELDS: {
  key: Exclude<keyof AdminIncentiveApplicationUpdateInput, 'courses'>
  label: string
  type?: string
}[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'batch', label: 'Batch' },
  { key: 'email', label: 'Recorded email', type: 'email' },
  { key: 'currentSemester', label: 'Current semester' },
  { key: 'phoneNumber', label: 'Phone number', type: 'tel' },
]

const COURSE_FIELDS: {
  key: keyof IncentiveCourse
  label: string
  type?: string
}[] = [
  { key: 'courseName', label: 'Course name' },
  { key: 'courseCode', label: 'Course code' },
  { key: 'teacherName', label: 'Teacher name' },
  { key: 'teacherInitial', label: 'Teacher initial' },
  { key: 'section', label: 'Section' },
  { key: 'teacherEmail', label: 'Teacher email', type: 'email' },
  { key: 'teacherPhone', label: 'Teacher phone', type: 'tel' },
]

const formFrom = (
  application: AdminIncentiveApplication,
): AdminIncentiveApplicationUpdateInput => ({
  fullName: application.fullName,
  studentId: application.studentId,
  batch: application.batch,
  email: application.email,
  currentSemester: application.currentSemester,
  phoneNumber: application.phoneNumber,
  courses: application.courses.map((course) => ({ ...course })),
})

export function AdminIncentiveApplicationForm({
  application,
  onCancel,
}: {
  application: AdminIncentiveApplication
  onCancel: () => void
}) {
  const initial = useMemo(() => formFrom(application), [application])
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const updateApplication = useAdminUpdateIncentiveApplication(application.id)
  const isDirty = JSON.stringify(form) !== JSON.stringify(saved)

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const blocker = useBlocker(isDirty)

  const setField = (
    key: Exclude<keyof AdminIncentiveApplicationUpdateInput, 'courses'>,
    value: string,
  ) => setForm((previous) => ({ ...previous, [key]: value }))

  const setCourseField = (index: number, key: keyof IncentiveCourse, value: string) =>
    setForm((previous) => ({
      ...previous,
      courses: previous.courses.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [key]: value } : course,
      ),
    }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setIssues({})
    updateApplication.mutate(form, {
      onSuccess: () => {
        setSaved(form)
        toast.success('Application updated.')
        onCancel()
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
          <CardTitle>Edit submitted details</CardTitle>
          <CardDescription>
            Changes are visible to the applicant. Editing does not change the account
            that owns this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {PERSONAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`admin-incentive-${field.key}`}>{field.label}</Label>
              <Input
                id={`admin-incentive-${field.key}`}
                type={field.type}
                value={form[field.key]}
                onChange={(event) => setField(field.key, event.target.value)}
                aria-invalid={Boolean(issues[field.key])}
                required
              />
              {issues[field.key] && (
                <p className="text-sm text-destructive">{issues[field.key]}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            At least one complete course is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.courses.map((course, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl bg-muted/50 p-4 shadow-clay-inset sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Course {index + 1}</p>
                {form.courses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        courses: previous.courses.filter((_, courseIndex) => courseIndex !== index),
                      }))
                    }
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {COURSE_FIELDS.map((field) => {
                  const id = `admin-course-${index}-${field.key}`
                  const issue = issues[`courses.${index}.${field.key}`]
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={id}>{field.label}</Label>
                      <Input
                        id={id}
                        type={field.type}
                        value={course[field.key]}
                        onChange={(event) =>
                          setCourseField(index, field.key, event.target.value)
                        }
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
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              setForm((previous) => ({
                ...previous,
                courses: [...previous.courses, { ...EMPTY_COURSE }],
              }))
            }
          >
            <Plus className="size-4" /> Add another course
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateApplication.isPending || !isDirty}>
          {updateApplication.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Leaving this application now discards your edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
