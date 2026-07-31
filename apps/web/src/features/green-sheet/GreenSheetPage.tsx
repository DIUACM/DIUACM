import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

const GREEN_SHEET_URL =
  'https://docs.google.com/spreadsheets/u/0/d/1TqavRYZeSarIO7-5r0Bi73Ne7EfmzkhMwJLGwa-5Bs8/edit'

export function GreenSheetPage() {
  useDocumentTitle('Green Sheet Practice Tracker')

  return (
    <div>
      <PageHeader title="Green Sheet Practice Tracker" />

      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl bg-card px-6 py-12 text-center shadow-clay sm:px-10 sm:py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Build your problem-solving foundation
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Practice beginner-friendly programming problems and prepare for advanced DIU ACM
          training and opportunities.
        </p>

        <Button asChild size="lg" className="mt-8 h-14 px-8 text-lg">
          <a href={GREEN_SHEET_URL} target="_blank" rel="noreferrer">
            Open Green Sheet <ArrowUpRight />
          </a>
        </Button>

        <p className="mt-6 text-xs text-muted-foreground">
          Make your own copy from File → Make a copy. Please do not request edit access.
        </p>
      </section>
    </div>
  )
}
