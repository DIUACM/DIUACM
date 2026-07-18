import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  image: string | null
  className?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('size-8', className)}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="text-xs font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
