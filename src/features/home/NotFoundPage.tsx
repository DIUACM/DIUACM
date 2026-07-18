import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-7xl font-bold tracking-tight text-muted-foreground/30">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
