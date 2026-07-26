import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useDeleteHandle, useMyHandles, useSetHandle } from '@/api/queries/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/states'
import { HANDLE_LABELS, HANDLE_TYPES, handleProfileUrl } from '@/lib/constants'
import type { HandleEntry, HandleType } from '@/api/types'
import { useAuth } from '@/features/auth/auth-context'

function HandleRow({
  type,
  handles,
}: {
  type: HandleType
  handles: HandleEntry[]
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(handles[0]?.handle ?? '')
  const setHandle = useSetHandle()
  const deleteHandle = useDeleteHandle()
  const { user, setUser } = useAuth()
  const canSet = handles.length <= 1
  const onlyHandle = handles[0]

  useEffect(() => {
    if (!editing) setValue(onlyHandle?.handle ?? '')
  }, [editing, onlyHandle?.handle])

  const save = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    setHandle.mutate(
      { type, handle: trimmed },
      {
        onSuccess: (response) => {
          if (user) setUser({ ...user, maxCfRating: response.maxCfRating })
          toast.success(`${HANDLE_LABELS[type]} handle saved.`)
          setEditing(false)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const remove = (entry: HandleEntry) => {
    deleteHandle.mutate({ type, handleId: entry.id }, {
      onSuccess: (response) => {
        if (user) setUser({ ...user, maxCfRating: response.maxCfRating })
        toast.success(`${HANDLE_LABELS[type]} handle removed.`)
        setValue(response.handles[type][0]?.handle ?? '')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-28 shrink-0 text-sm font-medium">
        {HANDLE_LABELS[type]}
      </span>

      {editing ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={`${HANDLE_LABELS[type]} handle`}
            autoFocus
            className="h-8"
          />
          <Button
            type="submit"
            size="icon"
            className="size-8"
            disabled={setHandle.isPending || value.trim() === ''}
            aria-label="Save handle"
          >
            <Check className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => {
              setEditing(false)
              setValue(onlyHandle?.handle ?? '')
            }}
            aria-label="Cancel"
          >
            <X className="size-4" />
          </Button>
        </form>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {handles.length > 0 ? (
            handles.map((entry) => (
              <div key={entry.id} className="flex min-w-0 items-center gap-2">
                <a
                  href={handleProfileUrl(type, entry.handle)}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  {entry.handle}
                </a>
                {canSet && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditing(true)}
                    aria-label={`Edit ${HANDLE_LABELS[type]} handle`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => remove(entry)}
                  disabled={deleteHandle.isPending}
                  aria-label={`Remove ${HANDLE_LABELS[type]} handle ${entry.handle}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-muted-foreground/60">
                Not set
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => setEditing(true)}
                aria-label={`Add ${HANDLE_LABELS[type]} handle`}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
          {!canSet && (
            <p className="text-xs text-muted-foreground">
              Multiple VJudge handles are admin-managed. Remove extras to edit.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function HandlesManager() {
  const handlesQuery = useMyHandles(true)

  if (handlesQuery.isPending) return <Skeleton className="h-36 w-full" />
  if (handlesQuery.isError) {
    return (
      <ErrorState
        error={handlesQuery.error}
        onRetry={() => void handlesQuery.refetch()}
      />
    )
  }

  const handles = handlesQuery.data.handles

  return (
    <div className="divide-y">
      {HANDLE_TYPES.map((type) => (
        <HandleRow key={type} type={type} handles={handles[type]} />
      ))}
    </div>
  )
}
