import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronDown, Download, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  fetchAdminIncentiveApplicationsForExport,
  useAdminBulkDeleteIncentiveApplications,
  useAdminIncentiveApplications,
  useAdminIncentiveFilterOptions,
} from '@/api/queries/admin-incentives'
import { DataPanel } from '@/components/shared/DataPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BulkBar, RowCheckbox, SelectAllHead } from '@/features/admin/shared/BulkBar'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import {
  downloadIncentiveExport,
  type IncentiveExportFormat,
} from './incentive-export'

const ALL = 'all'

export function AdminIncentiveApplicationsPage() {
  useDocumentTitle('Admin · Incentive applications')
  const [exportingFormat, setExportingFormat] = useState<IncentiveExportFormat | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const batch = searchParams.get('batch') ?? undefined
  const semester = searchParams.get('semester') ?? undefined

  const applicationsQuery = useAdminIncentiveApplications({ page, q, batch, semester })
  const filterOptions = useAdminIncentiveFilterOptions()
  const bulkDelete = useAdminBulkDeleteIncentiveApplications()
  const selection = useRowSelection(
    (applicationsQuery.data?.data ?? []).map((application) => application.id),
  )

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const runBulkDelete = () => {
    bulkDelete.mutate(selection.selected, {
      onSuccess: ({ affected }) => {
        selection.clear()
        toast.success(
          `${affected} application${affected === 1 ? '' : 's'} deleted.`,
        )
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const runExport = async (format: IncentiveExportFormat) => {
    setExportingFormat(format)
    try {
      const applications = await fetchAdminIncentiveApplicationsForExport({
        q,
        batch,
        semester,
      })
      downloadIncentiveExport(applications, format)
      toast.success(
        `${applications.length} application${applications.length === 1 ? '' : 's'} exported.`,
      )
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExportingFormat(null)
    }
  }

  const exportDisabled =
    applicationsQuery.isPending ||
    applicationsQuery.isError ||
    applicationsQuery.data?.meta.total === 0 ||
    exportingFormat !== null

  return (
    <div>
      <PageHeader
        title="Incentive applications"
        description="Course incentive applications submitted by students."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exportDisabled}>
              {exportingFormat ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Download aria-hidden="true" />
              )}
              {exportingFormat ? 'Exporting…' : 'Export'}
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>All filtered applications</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => void runExport('xlsx')}>
              <FileSpreadsheet aria-hidden="true" />
              Excel workbook (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void runExport('csv')}>
              <FileText aria-hidden="true" />
              CSV file (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search name, student ID, email, phone…"
          className="flex-1"
        />
        <Select
          value={batch ?? ALL}
          onValueChange={(value) => updateParams({ batch: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any batch</SelectItem>
            {(filterOptions.data?.batches ?? []).map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={semester ?? ALL}
          onValueChange={(value) => updateParams({ semester: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any semester</SelectItem>
            {(filterOptions.data?.semesters ?? []).map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {applicationsQuery.isPending ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : applicationsQuery.isError ? (
        <ErrorState
          error={applicationsQuery.error}
          onRetry={() => void applicationsQuery.refetch()}
        />
      ) : applicationsQuery.data.data.length === 0 ? (
        <EmptyState message="No applications match your filters." />
      ) : (
        <div className="space-y-4">
          <BulkBar selection={selection}>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={bulkDelete.isPending}>
                  Delete
                </Button>
              }
              title={`Delete ${selection.count} application${
                selection.count === 1 ? '' : 's'
              }?`}
              description="This cannot be undone. The students may submit again afterwards."
              onConfirm={runBulkDelete}
            />
          </BulkBar>
          <DataPanel>
            <Table>
              <TableHeader>
                <TableRow>
                  <SelectAllHead selection={selection} label="Select all applications" />
                  <TableHead>Applicant</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationsQuery.data.data.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <RowCheckbox
                        selection={selection}
                        id={application.id}
                        label={`Select ${application.fullName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/incentive-applications/${application.id}`}
                        className="font-medium hover:underline"
                      >
                        {application.fullName}
                      </Link>
                      <p className="text-muted-foreground">{application.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.studentId}
                    </TableCell>
                    <TableCell>{application.batch}</TableCell>
                    <TableCell>{application.currentSemester}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{application.courses.length}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(application.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataPanel>
          <Pagination
            meta={applicationsQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
