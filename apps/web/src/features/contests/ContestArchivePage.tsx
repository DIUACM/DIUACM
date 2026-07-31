import {
  ArrowUpRight,
  CalendarRange,
  Flag,
  FlaskConical,
  Layers3,
  Medal,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'
import contestDataJson from './contest-data.json?raw'

type ContestSeries = 'uta' | 'topc'
type ContestType = 'mock' | 'preliminary' | 'final' | 'main' | 'replay'

interface ContestRecord {
  semester: string
  year: number
  round: string
  type: ContestType
  title: string
  url: string
}

interface ContestSeriesData {
  name: string
  contests: ContestRecord[]
}

interface ContestData {
  source: {
    listingUrl: string
    fetchedAt: string
  }
  series: Record<ContestSeries, ContestSeriesData>
}

interface ContestEdition {
  semester: string
  year: number
  contests: ContestRecord[]
}

type RawContestRecord = [string, number, string, ContestType, string, string]

interface RawContestData {
  source: ContestData['source']
  series: Record<
    ContestSeries,
    { name: string; contests: RawContestRecord[] }
  >
}

const rawContestData = JSON.parse(contestDataJson) as RawContestData
const contestData: ContestData = {
  source: rawContestData.source,
  series: {
    uta: {
      name: rawContestData.series.uta.name,
      contests: rawContestData.series.uta.contests.map(
        ([semester, year, round, type, title, url]) => ({
          semester,
          year,
          round,
          type,
          title,
          url,
        }),
      ),
    },
    topc: {
      name: rawContestData.series.topc.name,
      contests: rawContestData.series.topc.contests.map(
        ([semester, year, round, type, title, url]) => ({
          semester,
          year,
          round,
          type,
          title,
          url,
        }),
      ),
    },
  },
}

const ROUND_STYLES: Record<
  ContestType,
  { icon: ComponentType<{ className?: string }>; className: string }
> = {
  mock: {
    icon: FlaskConical,
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  },
  preliminary: {
    icon: Flag,
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  },
  final: {
    icon: Medal,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  main: {
    icon: Sparkles,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  replay: {
    icon: RotateCcw,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
}

function groupByEdition(contests: ContestRecord[]): ContestEdition[] {
  const editions = new Map<string, ContestEdition>()

  for (const contest of contests) {
    const key = `${contest.semester}-${contest.year}`
    const edition = editions.get(key)

    if (edition) {
      edition.contests.push(contest)
    } else {
      editions.set(key, {
        semester: contest.semester,
        year: contest.year,
        contests: [contest],
      })
    }
  }

  return [...editions.values()]
}

interface ContestArchivePageProps {
  series: ContestSeries
}

function ContestArchivePage({ series }: ContestArchivePageProps) {
  const archive = contestData.series[series]
  const editions = groupByEdition(archive.contests)
  const shortName = series.toUpperCase()

  useDocumentTitle(`${shortName} Contest Archive`)

  return (
    <div>
      <PageHeader
        title={archive.name}
        description={`Browse all ${archive.contests.length} previous ${shortName} contests, grouped by semester and round.`}
      >
        <Button variant="outline" asChild>
          <a href={contestData.source.listingUrl} target="_blank" rel="noreferrer">
            Toph directory <ArrowUpRight />
          </a>
        </Button>
      </PageHeader>

      <Card className="mb-8 gap-4 bg-card/80">
        <CardContent className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              DIU ACM contest archive
            </p>
            <h2 className="mt-1 text-xl font-semibold">Every round, one directory</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Mock, preliminary, final, and replay contests link directly to their
              original pages on Toph.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-center">
            <div className="min-w-24 rounded-2xl bg-muted/70 px-4 py-3 shadow-clay-inset">
              <dt className="text-xs text-muted-foreground">Editions</dt>
              <dd className="mt-0.5 text-xl font-bold">{editions.length}</dd>
            </div>
            <div className="min-w-24 rounded-2xl bg-muted/70 px-4 py-3 shadow-clay-inset">
              <dt className="text-xs text-muted-foreground">Contests</dt>
              <dd className="mt-0.5 text-xl font-bold">{archive.contests.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {editions.map((edition) => (
          <Card key={`${edition.semester}-${edition.year}`} className="gap-4">
            <CardHeader className="border-b">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
                <CalendarRange className="size-5" />
              </div>
              <CardTitle className="mt-2 text-xl">
                {edition.semester} {edition.year}
              </CardTitle>
              <CardDescription>
                {edition.contests.length}{' '}
                {edition.contests.length === 1 ? 'contest' : 'contests'}
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  <Layers3 /> {shortName}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {edition.contests.map((contest, index) => {
                  const style = ROUND_STYLES[contest.type]
                  const RoundIcon = style.icon

                  return (
                    <li key={contest.url}>
                      <a
                        href={contest.url}
                        target="_blank"
                        rel="noreferrer"
                        title={contest.title}
                        className="group flex min-h-15 items-center gap-3 rounded-2xl bg-muted/55 p-2.5 pr-3 shadow-clay-sm outline-none transition-[background-color,box-shadow] hover:bg-muted hover:shadow-clay focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            style.className,
                          )}
                        >
                          <RoundIcon className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted-foreground">
                            {contest.type === 'replay' ? 'Replay' : `Round ${index + 1}`}
                          </span>
                          <span className="block font-medium leading-snug">
                            {contest.round}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="sr-only"> (opens on Toph in a new tab)</span>
                      </a>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Sourced from Toph’s public contest directory · Last checked 31 July 2026
      </p>
    </div>
  )
}

export function UtaContestArchivePage() {
  return <ContestArchivePage series="uta" />
}

export function TopcContestArchivePage() {
  return <ContestArchivePage series="topc" />
}
