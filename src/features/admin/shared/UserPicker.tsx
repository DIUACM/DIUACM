import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAdminUsers } from '@/api/queries/admin-users'
import { errorMessage } from '@/api/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Input } from '@/components/ui/input'
import type { UserSummary } from '@/api/types'

interface UserPickerProps {
  onSelect: (user: UserSummary) => void
  placeholder?: string
}

/**
 * Inline user search backed by GET /admin/users (needs `manage_users`;
 * the API error is surfaced if the caller lacks it).
 */
export function UserPicker({ onSelect, placeholder = 'Search users…' }: UserPickerProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const timerRef = useRef<number>(undefined)
  const usersQuery = useAdminUsers({ q: debounced }, debounced.length > 0)

  const handleChange = (value: string) => {
    setQuery(value)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setDebounced(value.trim()), 300)
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
      />
      {debounced.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
          {usersQuery.isPending ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : usersQuery.isError ? (
            <p className="px-3 py-2.5 text-sm text-destructive">
              {errorMessage(usersQuery.error)}
            </p>
          ) : usersQuery.data.data.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            usersQuery.data.data.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onSelect({
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                  })
                  setQuery('')
                  setDebounced('')
                }}
              >
                <UserAvatar name={user.name} image={user.image} className="size-6" />
                <span className="font-medium">{user.name}</span>
                <span className="text-muted-foreground">@{user.username}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
