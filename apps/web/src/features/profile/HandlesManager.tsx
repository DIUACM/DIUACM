import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useDeleteHandle, useMyHandles, useSetHandle } from '@/api/queries/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/states'
import { HANDLE_LABELS, HANDLE_TYPES, handleProfileUrl } from '@/lib/constants'
import type { HandleType } from '@/api/types'

function HandleRow({
  type,
  handle,
}: {
  type: HandleType
  handle: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(handle ?? '')
  const setHandle = useSetHandle()
  const deleteHandle = useDeleteHandle()

  const save = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    setHandle.mutate(
      { type, handle: trimmed },
      {
        onSuccess: () => {
          toast.success(`${HANDLE_LABELS[type]} handle saved.`)
          setEditing(false)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const remove = () => {
    deleteHandle.mutate(type, {
      onSuccess: () => {
        toast.success(`${HANDLE_LABELS[type]} handle removed.`)
        setValue('')
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
              setValue(handle ?? '')
            }}
            aria-label="Cancel"
          >
            <X className="size-4" />
          </Button>
        </form>
      ) : (
        <>
          {handle ? (
            <a
              href={handleProfileUrl(type, handle)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {handle}
            </a>
          ) : (
            <span className="flex-1 text-sm text-muted-foreground/60">
              Not set
            </span>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${HANDLE_LABELS[type]} handle`}
          >
            <Pencil className="size-4" />
          </Button>
          {handle && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-destructive hover:text-destructive"
              onClick={remove}
              disabled={deleteHandle.isPending}
              aria-label={`Remove ${HANDLE_LABELS[type]} handle`}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </>
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
        <HandleRow key={type} type={type} handle={handles[type]} />
      ))}
    </div>
  )
}
