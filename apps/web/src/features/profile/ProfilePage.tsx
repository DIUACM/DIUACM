import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useUpdateProfile,
  useUploadProfileImage,
} from '@/api/queries/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { UserAvatar } from '@/components/shared/UserAvatar'
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
import { useAuth } from '@/features/auth/auth-context'
import type { User } from '@/api/types'
import { HandlesManager } from './HandlesManager'
import { useDocumentTitle } from '@/lib/use-document-title'
import { CfRatingBadge } from '@/components/shared/CfRatingBadge'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function AvatarUploader({ user }: { user: User }) {
  const { setUser } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadProfileImage()

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Use a PNG, JPEG, GIF, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }
    uploadImage.mutate(file, {
      onSuccess: (response) => {
        setUser(response.user)
        toast.success('Profile photo updated!')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar name={user.name} image={user.image} className="size-20 text-xl shadow-clay" />
        {uploadImage.isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploadImage.isPending}
        >
          <Camera className="size-4" /> Change photo
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          PNG, JPEG, GIF, or WebP · max 5 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [studentId, setStudentId] = useState(user.studentId ?? '')
  const updateProfile = useUpdateProfile()

  const dirty =
    name !== user.name ||
    username !== user.username ||
    studentId !== (user.studentId ?? '')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateProfile.mutate(
      {
        name: name.trim(),
        username,
        studentId: studentId.trim() === '' ? null : studentId.trim(),
      },
      {
        onSuccess: (response) => {
          setUser(response.user)
          toast.success('Profile updated!')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="e.g. 201-15-XXXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>Max Codeforces rating</Label>
          {/* Read-only, but sits in a column of Inputs — it takes the same
              grooved field shape so the form doesn't break rhythm. */}
          <div className="flex h-9 items-center rounded-full bg-muted/60 px-3.5 text-sm shadow-clay-inset dark:bg-input/40">
            {user.maxCfRating === null ? (
              <span className="text-muted-foreground">Unrated</span>
            ) : (
              <CfRatingBadge rating={user.maxCfRating} />
            )}
          </div>
        </div>
      </div>
      <Button type="submit" disabled={!dirty || updateProfile.isPending}>
        {updateProfile.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

export function ProfilePage() {
  useDocumentTitle('Your profile')
  const { user } = useAuth()
  if (!user) return null

  return (
    <div>
      <PageHeader title="Your profile" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your public information on DIU ACM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarUploader user={user} />
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform handles</CardTitle>
            <CardDescription>
              Link your competitive programming accounts. These appear on your
              public programmer profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HandlesManager />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
