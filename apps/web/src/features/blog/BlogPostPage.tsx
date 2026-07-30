import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useBlogPost } from '@/api/queries/blog'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { ErrorState } from '@/components/shared/states'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/datetime'
import { useDocumentTitle } from '@/lib/use-document-title'

export function BlogPostPage() {
  const params = useParams()
  const slug = params.slug ?? ''
  const postQuery = useBlogPost(slug)
  useDocumentTitle(postQuery.data?.title)

  if (postQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full" />
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
    <article className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link to="/blog">
            <ArrowLeft className="size-4" /> All posts
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {post.author && (
            <Link
              to={`/programmers/${post.author.username}`}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <UserAvatar
                name={post.author.name}
                image={post.author.image}
                className="size-6 shadow-clay-sm"
              />
              <span className="font-medium text-foreground">{post.author.name}</span>
            </Link>
          )}
          {post.publishedAt !== null && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>
      </div>

      {post.featuredImageUrl && (
        <img
          src={post.featuredImageUrl}
          alt=""
          className="aspect-video w-full rounded-3xl object-cover shadow-clay ring-1 ring-foreground/5"
        />
      )}

      <MarkdownContent content={post.content} />
    </article>
  )
}
