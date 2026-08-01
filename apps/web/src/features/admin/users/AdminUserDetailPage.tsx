import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminAddHandle,
  useAdminDeleteHandle,
  useAdminDeleteUser,
  useAdminTogglePermission,
  useAdminUpdateHandle,
  useAdminUpdateUser,
  useAdminUser,
} from '@/api/queries/admin-users'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { BannedBadge } from '@/components/shared/BannedBadge'
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
import { PasswordInput } from '@/components/ui/password-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-context'
import {
  HANDLE_LABELS,
  HANDLE_TYPES,
  PERMISSION_LABELS,
  PERMISSIONS,
  handleProfileUrl,
} from '@/lib/constants'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { HandleType, HandlesMap, User } from '@/api/types'

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
          <PasswordInput
            id="u-password"
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

function BanControl({ user }: { user: User }) {
  const { user: viewer } = useAuth()
  const updateUser = useAdminUpdateUser(user.id)
  const [reason, setReason] = useState(user.banReason ?? '')
  const cannotBan = user.isSuperAdmin || viewer?.id === user.id

  if (user.isBanned) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <BannedBadge reason={user.banReason} />
          <p className="text-sm text-muted-foreground">{user.banReason}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={updateUser.isPending}
          onClick={() =>
            updateUser.mutate(
              { isBanned: false, banReason: null },
              {
                onSuccess: () => toast.success('User unbanned.'),
                onError: (error) => toast.error(errorMessage(error)),
              },
            )
          }
        >
          {updateUser.isPending ? 'Unbanning…' : 'Unban user'}
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const normalizedReason = reason.trim()
        if (!normalizedReason || cannotBan) return
        updateUser.mutate(
          { isBanned: true, banReason: normalizedReason },
          {
            onSuccess: () => toast.success('User banned.'),
            onError: (error) => toast.error(errorMessage(error)),
          },
        )
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="ban-reason">Public reason</Label>
        <Textarea
          id="ban-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Explain why this account is being banned…"
          disabled={cannotBan || updateUser.isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          This reason is public and appears when someone hovers or focuses the banned badge.
        </p>
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={cannotBan || updateUser.isPending || reason.trim() === ''}
      >
        {updateUser.isPending ? 'Banning…' : 'Ban user'}
      </Button>
      {cannotBan && (
        <p className="text-xs text-muted-foreground">
          You cannot ban yourself or the super admin.
        </p>
      )}
    </form>
  )
}

function AdminHandles({
  userId,
  handles,
}: {
  userId: number
  handles: HandlesMap
}) {
  const [editing, setEditing] = useState<{
    type: HandleType
    handleId: number | null
  } | null>(null)
  const [value, setValue] = useState('')
  const addHandle = useAdminAddHandle(userId)
  const updateHandle = useAdminUpdateHandle(userId)
  const deleteHandle = useAdminDeleteHandle(userId)
  const isSaving = addHandle.isPending || updateHandle.isPending

  const startAdding = (type: HandleType) => {
    setEditing({ type, handleId: null })
    setValue('')
  }

  const startEditing = (
    type: HandleType,
    handleId: number,
    handle: string,
  ) => {
    setEditing({ type, handleId })
    setValue(handle)
  }

  const cancelEditing = () => {
    setEditing(null)
    setValue('')
  }

  const saveHandle = (event: React.FormEvent) => {
    event.preventDefault()
    const handle = value.trim()
    if (!editing || !handle) return

    const label = HANDLE_LABELS[editing.type]
    const options = {
      onSuccess: () => {
        cancelEditing()
        toast.success(`${label} handle ${editing.handleId === null ? 'added' : 'updated'}.`)
      },
      onError: (error: unknown) => toast.error(errorMessage(error)),
    }

    if (editing.handleId === null) {
      addHandle.mutate({ type: editing.type, handle }, options)
    } else {
      updateHandle.mutate(
        { type: editing.type, handleId: editing.handleId, handle },
        options,
      )
    }
  }

  return (
    <div className="space-y-3">
      {HANDLE_TYPES.map((type) => {
        const entries = handles[type]
        const canAdd = type === 'vjudge' || entries.length === 0
        const isAdding = editing?.type === type && editing.handleId === null

        return (
          <div key={type} className="rounded-2xl bg-muted/50 p-3.5 shadow-clay-inset">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{HANDLE_LABELS[type]}</span>
              {canAdd && !isAdding && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => startAdding(type)}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              )}
            </div>

            {entries.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground">No handle linked.</p>
            )}

            <ul className="space-y-2">
              {entries.map(({ id, handle }) => {
                const isEditing =
                  editing?.type === type && editing.handleId === id

                return (
                  <li key={id}>
                    {isEditing ? (
                      <form className="flex gap-2" onSubmit={saveHandle}>
                        <Input
                          value={value}
                          onChange={(event) => setValue(event.target.value)}
                          aria-label={`Edit ${HANDLE_LABELS[type]} handle`}
                          autoFocus
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="shrink-0"
                          disabled={isSaving || value.trim() === ''}
                          aria-label={`Save ${HANDLE_LABELS[type]} handle`}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="shrink-0"
                          disabled={isSaving}
                          onClick={cancelEditing}
                          aria-label="Cancel editing"
                        >
                          <X className="size-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={handleProfileUrl(type, handle)}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 flex-1 truncate text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {handle}
                        </a>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => startEditing(type, id, handle)}
                          aria-label={`Edit ${HANDLE_LABELS[type]} handle ${handle}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          disabled={deleteHandle.isPending}
                          onClick={() =>
                            deleteHandle.mutate(
                              { type, handleId: id },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    `${HANDLE_LABELS[type]} handle removed.`,
                                  ),
                                onError: (error) =>
                                  toast.error(errorMessage(error)),
                              },
                            )
                          }
                          aria-label={`Remove ${HANDLE_LABELS[type]} handle ${handle}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {isAdding && (
              <form className="mt-2 flex gap-2" onSubmit={saveHandle}>
                <Input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={`Add ${HANDLE_LABELS[type]} handle`}
                  aria-label={`${HANDLE_LABELS[type]} handle`}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0"
                  disabled={isSaving || value.trim() === ''}
                  aria-label={`Add ${HANDLE_LABELS[type]} handle`}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  disabled={isSaving}
                  onClick={cancelEditing}
                  aria-label="Cancel adding"
                >
                  <X className="size-4" />
                </Button>
              </form>
            )}
          </div>
        )
      })}
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
                {user.isBanned && <BannedBadge reason={user.banReason} />}
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

      <Card>
        <CardHeader>
          <CardTitle>Account status</CardTitle>
          <CardDescription>
            Banning immediately blocks sign-in and active sessions, and places the user last in ranklists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BanControl key={`${user.id}-${user.isBanned}`} user={user} />
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
              Add, edit, or remove platform handles. VJudge supports multiple
              handles.
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
