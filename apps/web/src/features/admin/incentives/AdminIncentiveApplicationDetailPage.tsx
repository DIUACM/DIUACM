import { ArrowLeft, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminDeleteIncentiveApplication,
  useAdminIncentiveApplication,
} from '@/api/queries/admin-incentives'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { BannedBadge } from '@/components/shared/BannedBadge'
import { ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { formatDateTime } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import { ProgrammerHandles } from './ProgrammerHandles'

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

export function AdminIncentiveApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const applicationQuery = useAdminIncentiveApplication(Number(id))
  const deleteApplication = useAdminDeleteIncentiveApplication()
  const application = applicationQuery.data?.application
  useDocumentTitle(
    application ? `Admin · ${application.fullName}` : 'Admin · Incentive application',
  )

  const handleDelete = () => {
    deleteApplication.mutate(Number(id), {
      onSuccess: () => {
        toast.success('Application deleted.')
        void navigate('/admin/incentive-applications')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  if (applicationQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (applicationQuery.isError) {
    return (
      <ErrorState
        error={applicationQuery.error}
        onRetry={() => void applicationQuery.refetch()}
      />
    )
  }

  const { applicant } = applicationQuery.data.application
  const record = applicationQuery.data.application

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/admin/incentive-applications"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All applications
        </Link>
        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="sm" disabled={deleteApplication.isPending}>
              <Trash2 className="size-4" /> Delete
            </Button>
          }
          title="Delete this application?"
          description="This cannot be undone. The student may submit a new one afterwards."
          onConfirm={handleDelete}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{record.fullName}</h1>
        <p className="mt-2 text-muted-foreground">
          Submitted {formatDateTime(record.createdAt)}
          {record.updatedAt !== record.createdAt &&
            ` · updated ${formatDateTime(record.updatedAt)}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {applicant ? (
            <div className="flex flex-wrap items-center gap-3">
              <UserAvatar
                name={applicant.name}
                image={applicant.image}
                className="size-10"
              />
              <div>
                <Link
                  to={`/admin/users/${applicant.id}`}
                  className="font-medium hover:underline"
                >
                  {applicant.name}
                </Link>
                <p className="text-sm text-muted-foreground">@{applicant.username}</p>
              </div>
              {applicant.isBanned && <BannedBadge reason={applicant.banReason} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The account that filed this application no longer exists.
            </p>
          )}
          <div className="border-t border-border/70 pt-5">
            <p className="mb-3 text-sm font-medium">Programmer handles</p>
            <ProgrammerHandles handles={record.handles} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details as submitted</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Detail label="Full name" value={record.fullName} />
          <Detail label="Student ID" value={record.studentId} />
          <Detail label="Batch" value={record.batch} />
          <Detail label="Email" value={record.email} />
          <Detail label="Current semester" value={record.currentSemester} />
          <Detail label="Phone number" value={record.phoneNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses ({record.courses.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.courses.map((course, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl bg-muted/50 p-5 shadow-clay-inset"
            >
              <p className="font-semibold">
                {course.courseName}{' '}
                <span className="text-muted-foreground">({course.courseCode})</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Section" value={course.section} />
                <Detail
                  label="Teacher"
                  value={`${course.teacherName} (${course.teacherInitial})`}
                />
                <Detail label="Teacher email" value={course.teacherEmail} />
                <Detail label="Teacher phone" value={course.teacherPhone} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
