import { Loader2 } from 'lucide-react'
import { useAdminUsers } from '@/api/queries/admin-users'
import { errorMessage } from '@/api/client'
import { SearchDropdown } from '@/features/admin/shared/SearchDropdown'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { BannedBadge } from '@/components/shared/BannedBadge'
import type { UserSummary } from '@/api/types'

interface UserPickerProps {
  onSelect: (user: UserSummary) => void
  placeholder?: string
}

function UserResults({
  query,
  onSelect,
}: {
  query: string
  onSelect: (user: UserSummary) => void
}) {
  const usersQuery = useAdminUsers({ q: query })

  if (usersQuery.isPending) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    )
  }
  if (usersQuery.isError) {
    return (
      <p className="px-3 py-2.5 text-sm text-destructive">
        {errorMessage(usersQuery.error)}
      </p>
    )
  }
  if (usersQuery.data.data.length === 0) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted-foreground">No users found.</p>
    )
  }
  return usersQuery.data.data.map((user) => (
    <button
      key={user.id}
      type="button"
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={() =>
        onSelect({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          isBanned: user.isBanned,
          banReason: user.banReason,
        })
      }
    >
      <UserAvatar name={user.name} image={user.image} className="size-6" />
      <span className="font-medium">{user.name}</span>
      <span className="text-muted-foreground">@{user.username}</span>
      {user.isBanned && <BannedBadge reason={user.banReason} className="h-5 px-2" />}
    </button>
  ))
}

/**
 * Inline user search backed by GET /admin/users (needs `manage_users`;
 * the API error is surfaced if the caller lacks it).
 */
export function UserPicker({ onSelect, placeholder = 'Search users…' }: UserPickerProps) {
  return (
    <SearchDropdown placeholder={placeholder}>
      {(query, close) => (
        <UserResults
          query={query}
          onSelect={(user) => {
            onSelect(user)
            close()
          }}
        />
      )}
    </SearchDropdown>
  )
}
