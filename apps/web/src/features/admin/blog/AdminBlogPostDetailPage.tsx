import { ArrowLeft, ImagePlus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminBlogPost,
  useAdminDeleteBlogPost,
  useAdminRemoveBlogFeaturedImage,
  useAdminSetBlogFeaturedImage,
  useAdminUpdateBlogPost,
} from '@/api/queries/admin-blog'
import type { AdminBlogPostDetail } from '@/api/queries/admin-blog'
import type { PublishStatus } from '@/api/queries/admin-events'
import { BlogEditor } from '@/features/admin/blog/BlogEditor'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import { ErrorState } from '@/components/shared/states'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function PostEditForm({ post }: { post: AdminBlogPostDetail }) {
  const updatePost = useAdminUpdateBlogPost(post.id)
  const loaded = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    status: post.status,
  }
  const [form, setForm] = useState(loaded)
  // Last successfully persisted values. Comparing against these — rather than
  // the `post` prop — keeps the form clean straight after a save, without
  // waiting for the query to refetch.
  const [saved, setSaved] = useState(loaded)
  const isDirty =
    form.title !== saved.title ||
    form.slug !== saved.slug ||
    form.content !== saved.content ||
    form.status !== saved.status

  // Full page unloads (reload, close tab, external link) get the browser's
  // native prompt; in-app navigation is caught by the blocker below.
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const blocker = useBlocker(isDirty)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      title: form.title.trim(),
      slug: form.slug,
      content: form.content,
      status: form.status,
    }
    updatePost.mutate(payload, {
      onSuccess: () => {
        setSaved(payload)
        toast.success('Post updated.')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bp-title">Title</Label>
          <Input
            id="bp-title"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bp-slug">Slug</Label>
          <Input
            id="bp-slug"
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: event.target.value }))
            }
            pattern="[a-z0-9-]+"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        {/* A caption, not a <label>: the editor is a contenteditable, which
            `htmlFor` can't target. It carries its own aria-label instead. */}
        <span className="flex items-center text-sm leading-none font-medium select-none">
          Body
        </span>
        <BlogEditor
          postId={post.id}
          value={form.content}
          onChange={(content) => setForm((prev) => ({ ...prev, content }))}
          assets={post.assets}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bp-status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as PublishStatus }))
          }
        >
          <SelectTrigger id="bp-status" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updatePost.isPending || !isDirty}>
          {updatePost.isPending ? 'Saving…' : 'Save changes'}
        </Button>
        {isDirty && (
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
        )}
      </div>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This post has edits that haven’t been saved. Leaving now discards them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function FeaturedImageManager({ post }: { post: AdminBlogPostDetail }) {
  const setImage = useAdminSetBlogFeaturedImage(post.id)
  const removeImage = useAdminRemoveBlogFeaturedImage(post.id)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setImage.mutate(file, {
      onSuccess: () => toast.success('Featured image set.'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="space-y-4">
      {post.featuredImageUrl ? (
        <div className="group relative max-w-md overflow-hidden rounded-2xl shadow-clay-sm ring-1 ring-foreground/5">
          <img
            src={post.featuredImageUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove featured image"
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() =>
              removeImage.mutate(undefined, {
                onSuccess: () => toast.success('Featured image removed.'),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No featured image yet.</p>
      )}
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={setImage.isPending}
      >
        <ImagePlus className="size-4" />
        {setImage.isPending
          ? 'Uploading…'
          : post.featuredImageUrl
            ? 'Replace image'
            : 'Add image'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export function AdminBlogPostDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const postQuery = useAdminBlogPost(id)
  const deletePost = useAdminDeleteBlogPost()
  useDocumentTitle(
    postQuery.data ? `Admin · ${postQuery.data.title}` : 'Admin · Post',
  )

  if (postQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (postQuery.isError) {
    return (
      <ErrorState
        error={postQuery.error}
        onRetry={() => void postQuery.refetch()}
      />
    )
  }

  const post = postQuery.data

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/admin/blog">
            <ArrowLeft className="size-4" /> All posts
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight">
              {post.title}
              <StatusBadge status={post.status} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              /{post.slug} ·{' '}
              <Link to={`/blog/${post.slug}`} className="hover:underline">
                view public page
              </Link>
              {post.author && <> · by {post.author.name}</>}
              {post.publishedAt !== null && (
                <> · published {formatDate(post.publishedAt)}</>
              )}
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" /> Delete post
              </Button>
            }
            title={`Delete “${post.title}”?`}
            description="This permanently removes the post and its featured image."
            onConfirm={() =>
              deletePost.mutate(id, {
                onSuccess: () => {
                  toast.success('Post deleted.')
                  navigate('/admin/blog')
                },
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Keyed by id, not updatedAt: featured-image uploads bump updatedAt
              and would remount the form, discarding unsaved edits. */}
          <PostEditForm key={post.id} post={post} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured image</CardTitle>
          <CardDescription>
            Shown as the cover on the public blog list and post page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeaturedImageManager post={post} />
        </CardContent>
      </Card>
    </div>
  )
}
