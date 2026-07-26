import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddVjudgeHandle,
  useAdminDeleteUser,
  useAdminDeleteVjudgeHandle,
  useAdminTogglePermission,
  useAdminUpdateUser,
  useAdminUser,
} from '@/api/queries/admin-users'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
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
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/auth-context'
import {
  HANDLE_LABELS,
  HANDLE_TYPES,
  PERMISSION_LABELS,
  PERMISSIONS,
  handleProfileUrl,
} from '@/lib/constants'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { HandlesMap, User } from '@/api/types'

function UserEditForm({ user }: { user: User }) {
  const updateUser = useAdminUpdateUser(user.id)
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    username: user.username,
    studentId: user.studentId ?? '',
    maxCfRating: user.maxCfRating?.toString() ?? '',
    password: '',
  })

  const set =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const rating = form.maxCfRating.trim()
    updateUser.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username,
        studentId: form.studentId.trim() === '' ? null : form.studentId.trim(),
        maxCfRating: rating === '' ? null : Number(rating),
        ...(form.password ? { password: form.password } : {}),
      },
      {
        onSuccess: () => {
          toast.success('User updated.')
          setForm((prev) => ({ ...prev, password: '' }))
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="u-name">Full name</Label>
          <Input id="u-name" value={form.name} onChange={set('name')} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-username">Username</Label>
          <Input
            id="u-username"
            value={form.username}
            onChange={set('username')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-email">Email</Label>
          <Input
            id="u-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-studentId">Student ID</Label>
          <Input id="u-studentId" value={form.studentId} onChange={set('studentId')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-rating">Max CF rating</Label>
          <Input
            id="u-rating"
            type="number"
            value={form.maxCfRating}
            onChange={set('maxCfRating')}
            placeholder="Leave blank for none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-password">New password</Label>
          <Input
            id="u-password"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="Leave blank to keep current"
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" disabled={updateUser.isPending}>
        {updateUser.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

function PermissionToggles({ user }: { user: User }) {
  const { user: viewer } = useAuth()
  const togglePermission = useAdminTogglePermission(user.id)
  const canToggle = viewer?.isSuperAdmin && !user.isSuperAdmin

  return (
    <div className="space-y-1">
      {user.isSuperAdmin && (
        <p className="mb-3 text-sm text-muted-foreground">
          This account is the super admin and implicitly holds every
          permission.
        </p>
      )}
      {!viewer?.isSuperAdmin && !user.isSuperAdmin && (
        <p className="mb-3 text-sm text-muted-foreground">
          Only the super admin can change permissions.
        </p>
      )}
      {PERMISSIONS.map((permission) => (
        <div
          key={permission}
          className="flex items-center justify-between gap-3 py-2"
        >
          <Label htmlFor={`perm-${permission}`} className="font-normal">
            {PERMISSION_LABELS[permission]}
          </Label>
          <Switch
            id={`perm-${permission}`}
            checked={user.permissions.includes(permission)}
            disabled={!canToggle || togglePermission.isPending}
            onCheckedChange={(enabled) =>
              togglePermission.mutate(
                { permission, enabled },
                {
                  onSuccess: () =>
                    toast.success(
                      `${PERMISSION_LABELS[permission]} ${enabled ? 'granted' : 'revoked'}.`,
                    ),
                  onError: (error) => toast.error(errorMessage(error)),
                },
              )
            }
          />
        </div>
      ))}
    </div>
  )
}

function AdminHandles({
  userId,
  handles,
}: {
  userId: number
  handles: HandlesMap
}) {
  const [value, setValue] = useState('')
  const addHandle = useAdminAddVjudgeHandle(userId)
  const deleteHandle = useAdminDeleteVjudgeHandle(userId)
  const linkedHandles = HANDLE_TYPES.flatMap((type) =>
    handles[type].map(({ id, handle }) => ({ id, type, handle })),
  )

  const addVjudgeHandle = (event: React.FormEvent) => {
    event.preventDefault()
    const handle = value.trim()
    if (!handle) return
    addHandle.mutate(handle, {
      onSuccess: () => {
        setValue('')
        toast.success('VJudge handle added.')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="space-y-4">
      {linkedHandles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No handles linked.</p>
      ) : (
        <ul className="space-y-2">
          {linkedHandles.map(({ id, type, handle }) => (
            <li
              key={`${type}-${id}`}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-24 shrink-0 font-medium">
                {HANDLE_LABELS[type]}
              </span>
              <a
                href={handleProfileUrl(type, handle)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-muted-foreground hover:text-foreground hover:underline"
              >
                {handle}
              </a>
              {type === 'vjudge' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:text-destructive"
                  disabled={deleteHandle.isPending}
                  onClick={() =>
                    deleteHandle.mutate(id, {
                      onSuccess: () => toast.success('VJudge handle removed.'),
                      onError: (error) => toast.error(errorMessage(error)),
                    })
                  }
                  aria-label={`Remove VJudge handle ${handle}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="flex gap-2" onSubmit={addVjudgeHandle}>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add VJudge handle"
          aria-label="VJudge handle"
        />
        <Button
          type="submit"
          disabled={addHandle.isPending || value.trim() === ''}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </form>
    </div>
  )
}

export function AdminUserDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const userQuery = useAdminUser(id)
  const deleteUser = useAdminDeleteUser()
  useDocumentTitle(
    userQuery.data ? `Admin · ${userQuery.data.user.name}` : 'Admin · User',
  )

  if (userQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (userQuery.isError) {
    return (
      <ErrorState error={userQuery.error} onRetry={() => void userQuery.refetch()} />
    )
  }

  const { user, handles } = userQuery.data

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/admin/users">
            <ArrowLeft className="size-4" /> All users
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} image={user.image} className="size-12" />
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {user.name}
                {user.isSuperAdmin && <Badge>Super admin</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{user.username} ·{' '}
                <Link
                  to={`/programmers/${user.username}`}
                  className="hover:underline"
                >
                  public profile
                </Link>
              </p>
            </div>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" disabled={user.isSuperAdmin}>
                <Trash2 className="size-4" /> Delete user
              </Button>
            }
            title={`Delete ${user.name}?`}
            description="This permanently removes the user along with their handles, permissions, attendance, performance rows, and ranklist memberships."
            onConfirm={() =>
              deleteUser.mutate(id, {
                onSuccess: () => {
                  toast.success('User deleted.')
                  navigate('/admin/users')
                },
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <UserEditForm user={user} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Admin-panel access for this account.</CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionToggles user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handles</CardTitle>
            <CardDescription>
              Add multiple VJudge handles or remove them individually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminHandles userId={user.id} handles={handles} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
