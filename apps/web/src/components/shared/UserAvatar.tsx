import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  responsiveImageProps,
  type ImagePresetName,
} from '@/lib/responsive-image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  image: string | null
  className?: string
  imagePreset?: ImagePresetName
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

export function UserAvatar({
  name,
  image,
  className,
  imagePreset = 'avatar',
}: UserAvatarProps) {
  return (
    <Avatar className={cn('size-8', className)}>
      {image && (
        <AvatarImage
          {...responsiveImageProps(image, imagePreset)}
          alt={name}
          loading="lazy"
          decoding="async"
        />
      )}
      <AvatarFallback className="text-xs font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
