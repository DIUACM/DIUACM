import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useAdminCreateUser, useAdminUsers } from '@/api/queries/admin-users'
import { CfRatingBadge } from '@/components/shared/CfRatingBadge'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { PERMISSION_LABELS, PERMISSIONS } from '@/lib/constants'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { Permission } from '@/api/types'

const ALL = 'all'

function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createUser = useAdminCreateUser()
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    studentId: '',
  })

  const set =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createUser.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username,
        password: form.password || undefined,
        studentId: form.studentId.trim() || undefined,
      },
      {
        onSuccess: (response) => {
          toast.success(`User ${response.user.username} created.`)
          setOpen(false)
          navigate(`/admin/users/${response.user.id}`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Password is optional — without one the user can only sign in with
            Google.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Full name</Label>
            <Input id="new-name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={form.username}
                onChange={set('username')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-studentId">Student ID</Label>
              <Input
                id="new-studentId"
                value={form.studentId}
                onChange={set('studentId')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password (optional)</Label>
            <Input
              id="new-password"
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsersPage() {
  useDocumentTitle('Admin · Users')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const permission =
    (searchParams.get('permission') as Permission | null) ?? undefined

  const usersQuery = useAdminUsers({ page, q, permission })

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

  return (
    <div>
      <PageHeader title="Users" description="All registered accounts.">
        <CreateUserDialog />
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search name, username, email, student ID…"
          className="flex-1"
        />
        <Select
          value={permission ?? ALL}
          onValueChange={(value) =>
            updateParams({ permission: value, page: undefined })
          }
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any permission</SelectItem>
            {PERMISSIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {PERMISSION_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usersQuery.isPending ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : usersQuery.isError ? (
        <ErrorState
          error={usersQuery.error}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : usersQuery.data.data.length === 0 ? (
        <EmptyState message="No users match your filters." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead className="text-center">CF rating</TableHead>
                  <TableHead className="pr-4">Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-4">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <UserAvatar
                          name={user.name}
                          image={user.image}
                          className="size-7"
                        />
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground">
                          @{user.username}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.studentId ?? '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <CfRatingBadge rating={user.maxCfRating} className="text-sm" />
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex flex-wrap gap-1">
                        {user.isSuperAdmin ? (
                          <Badge>Super admin</Badge>
                        ) : (
                          user.permissions.map((permissionName) => (
                            <Badge key={permissionName} variant="secondary">
                              {PERMISSION_LABELS[permissionName]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            meta={usersQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
