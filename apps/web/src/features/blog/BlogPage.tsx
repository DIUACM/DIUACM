import { CalendarDays, Newspaper } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useBlogPosts } from '@/api/queries/blog'
import { Pagination } from '@/components/shared/Pagination'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { BlogPostListItem } from '@/api/types'

function BlogPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <Card className="clay-lift h-full overflow-hidden py-0">
        {post.featuredImageUrl ? (
          <img
            src={post.featuredImageUrl}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <Newspaper className="size-8 text-muted-foreground" />
          </div>
        )}
        <CardContent className="flex flex-col gap-2 pb-5">
          <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">{post.title}</h3>
          {post.excerpt && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
            {post.author && (
              <span className="inline-flex items-center gap-1.5">
                <UserAvatar
                  name={post.author.name}
                  image={post.author.image}
                  className="size-5"
                />
                {post.author.name}
              </span>
            )}
            {post.publishedAt !== null && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatDate(post.publishedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function BlogPage() {
  useDocumentTitle('Blog')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') ?? ''
  const postsQuery = useBlogPosts({ page, q })

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Announcements, editorials, and stories from the community."
      />

      <div className="mb-6">
        <SearchInput
          value={q}
          onChange={(value) => updateParams({ q: value, page: undefined })}
          placeholder="Search posts…"
          className="sm:max-w-sm"
        />
      </div>

      {postsQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : postsQuery.isError ? (
        <ErrorState
          error={postsQuery.error}
          onRetry={() => void postsQuery.refetch()}
        />
      ) : postsQuery.data.data.length === 0 ? (
        <EmptyState
          message={q ? 'No posts match your search.' : 'No posts published yet.'}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {postsQuery.data.data.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
          <Pagination
            meta={postsQuery.data.meta}
            onPageChange={(nextPage) =>
              updateParams({ page: nextPage === 1 ? undefined : String(nextPage) })
            }
          />
        </div>
      )}
    </div>
  )
}
