import { CopyPlus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminIncentiveReplicationTargets,
  useAdminReplicateIncentiveApplication,
} from '@/api/queries/admin-incentives'
import type { UserSummary } from '@/api/types'
import { BannedBadge } from '@/components/shared/BannedBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ReplicateApplicationDialog({ applicationId }: { applicationId: number }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserSummary | null>(null)
  const targets = useAdminIncentiveReplicationTargets(query, open)
  const replicate = useAdminReplicateIncentiveApplication(applicationId)
  const navigate = useNavigate()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setSelected(null)
    }
  }

  const handleReplicate = () => {
    if (!selected) return
    replicate.mutate(selected.id, {
      onSuccess: ({ application }) => {
        toast.success(`Application replicated for @${selected.username}.`)
        setOpen(false)
        void navigate(`/admin/incentive-applications/${application.id}`)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CopyPlus className="size-4" /> Replicate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Replicate application</DialogTitle>
          <DialogDescription>
            Choose an account without an application. Submitted details are copied, and
            the new record uses that account&apos;s verified email.
          </DialogDescription>
        </DialogHeader>

        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value)
            setSelected(null)
          }}
          placeholder="Search name, username, email, or student ID…"
        />

        <div className="max-h-64 min-h-32 overflow-y-auto rounded-2xl border border-border/70 p-1.5">
          {targets.isPending ? (
            <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading accounts…
            </div>
          ) : targets.isError ? (
            <p className="p-3 text-sm text-destructive">{errorMessage(targets.error)}</p>
          ) : targets.data.users.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              No eligible accounts match this search.
            </p>
          ) : (
            targets.data.users.map((user) => {
              const active = selected?.id === user.id
              return (
                <button
                  key={user.id}
                  type="button"
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setSelected(user)}
                >
                  <UserAvatar name={user.name} image={user.image} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{user.name}</span>
                    <span
                      className={`block truncate text-xs ${
                        active ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}
                    >
                      @{user.username}
                    </span>
                  </span>
                  {user.isBanned && <BannedBadge reason={user.banReason} />}
                </button>
              )
            })
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            disabled={!selected || replicate.isPending}
            onClick={handleReplicate}
          >
            {replicate.isPending ? 'Replicating…' : 'Create replica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
