import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-card px-6 py-20 text-center shadow-clay ring-1 ring-foreground/5">
      <p className="bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-7xl font-bold text-transparent">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-pretty">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
