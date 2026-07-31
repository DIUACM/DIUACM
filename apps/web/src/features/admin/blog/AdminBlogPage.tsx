import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import {
  useAdminBlogPosts,
  useAdminBulkBlogPosts,
  useAdminCreateBlogPost,
} from '@/api/queries/admin-blog'
import type { PublishStatus } from '@/api/queries/admin-events'
import type { BulkPublishAction } from '@/api/types'
import { DataPanel } from '@/components/shared/DataPanel'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/features/admin/shared/StatusBadge'
import {
  PublishBulkBar,
  RowCheckbox,
  SelectAllHead,
} from '@/features/admin/shared/BulkBar'
import { useRowSelection } from '@/features/admin/shared/use-row-selection'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

const ALL = 'all'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function CreatePostDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const createPost = useAdminCreateBlogPost()
  const [form, setForm] = useState({ title: '', slug: '' })
  const [slugTouched, setSlugTouched] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createPost.mutate(
      { title: form.title.trim(), slug: form.slug },
      {
        onSuccess: (post) => {
          toast.success('Post created.')
          setOpen(false)
          navigate(`/admin/blog/${post.id}`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create post</DialogTitle>
          <DialogDescription>
            Posts start as drafts — write the body on the next screen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="b-title">Title</Label>
            <Input
              id="b-title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                  slug: slugTouched ? prev.slug : slugify(event.target.value),
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-slug">Slug</Label>
            <Input
              id="b-slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }}
              pattern="[a-z0-9-]+"
              placeholder="lowercase-with-dashes"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createPost.isPending}>
              {createPost.isPending ? 'Creating…' : 'Create post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminBlogPage() {
  useDocumentTitle('Admin · Blog')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as PublishStatus | null) ?? undefined

  const postsQuery = useAdminBlogPosts({ page, q, status })
  const bulkPosts = useAdminBulkBlogPosts()
  const selection = useRowSelection(
    (postsQuery.data?.data ?? []).map((post) => post.id),
  )

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const runBulk = (action: BulkPublishAction) => {
    bulkPosts.mutate(
      { ids: selection.selected, action },
      {
        onSuccess: ({ affected }) => {
          selection.clear()
          const result =
            action === 'publish'
              ? 'published'
              : action === 'draft'
                ? 'moved to drafts'
                : 'deleted'
          toast.success(`${affected} post${affected === 1 ? '' : 's'} ${result}.`)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div>
      <PageHeader title="Blog" description="All posts, including drafts.">
        <CreatePostDialog />
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search posts…"
          className="flex-1"
        />
        <Select
          value={status ?? ALL}
          onValueChange={(value) => updateParams({ status: value, page: undefined })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {postsQuery.isPending ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : postsQuery.isError ? (
        <ErrorState
          error={postsQuery.error}
          onRetry={() => void postsQuery.refetch()}
        />
      ) : postsQuery.data.data.length === 0 ? (
        <EmptyState message="No posts match your filters." />
      ) : (
        <div className="space-y-4">
          <PublishBulkBar
            selection={selection}
            itemLabel="post"
            isPending={bulkPosts.isPending}
            onAction={runBulk}
          />
          <DataPanel>
            <Table>
              <TableHeader>
                <TableRow>
                  <SelectAllHead
                    selection={selection}
                    label="Select all posts"
                  />
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsQuery.data.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <RowCheckbox
                        selection={selection}
                        id={post.id}
                        label={`Select ${post.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/blog/${post.id}`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.publishedAt !== null ? formatDate(post.publishedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataPanel>
          <Pagination
            meta={postsQuery.data.meta}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </div>
      )}
    </div>
  )
}
