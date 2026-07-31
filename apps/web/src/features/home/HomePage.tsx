import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  FileSpreadsheet,
  Puzzle,
  Rocket,
  Trophy,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'
import { useEvents } from '@/api/queries/events'
import { EmptyState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { EventCard, EventListSkeleton } from '@/features/events/EventsPage'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

// `tint` colours the icon pebble on each tile. The varied hues let the six-card
// grid scan as distinct destinations rather than one repeated block.
const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Events',
    description:
      'Onsite and online contests, take-home classes, and community meetups — all in one calendar.',
    to: '/events',
    tint: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'Trackers',
    description:
      'Season-long ranklists that score every contest with weights, solves, and upsolves.',
    to: '/trackers',
    tint: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300',
  },
  {
    icon: Users,
    title: 'Programmers',
    description:
      'Browse member profiles with Codeforces, VJudge, and AtCoder handles and ratings.',
    to: '/programmers',
    tint: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  },
  {
    icon: Puzzle,
    title: 'Unlock the Algorithm',
    description:
      'Browse every previous UTA mock, preliminary slot, final, and replay on Toph.',
    to: '/contests/uta',
    tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  {
    icon: Rocket,
    title: 'Take-OFF',
    description:
      'Explore the complete Take-OFF Programming Contest archive, organized by semester.',
    to: '/contests/topc',
    tint: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
  },
  {
    icon: FileSpreadsheet,
    title: 'Green Sheet Practice Tracker',
    description: 'Track practice progress across the Green Sheet problem set.',
    to: '/green-sheet',
    tint: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300',
  },
]

export function HomePage() {
  useDocumentTitle()
  const { isAuthenticated } = useAuth()
  const eventsQuery = useEvents({ page: 1 })
  const recentEvents = eventsQuery.data?.data.slice(0, 4) ?? []

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="pt-6 text-center sm:pt-12">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-clay-sm ring-1 ring-foreground/5">
          <Trophy className="size-4 text-amber-500" />
          Daffodil International University
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold text-balance sm:text-6xl">
          The{' '}
          <span className="bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-transparent">
            competitive programming
          </span>{' '}
          community of DIU
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
          Compete in contests, climb the ranklists, and grow with programmers
          who love solving problems as much as you do.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link to="/events">
                Browse events <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/login">
                  Join the community <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/events">Browse events</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="group clay-lift-trigger block"
          >
            <Card className="clay-lift h-full">
              {/* `flex-1` lets the "Explore" row sit on the baseline of every
                  tile regardless of how long the description runs. */}
              <CardContent className="flex flex-1 flex-col gap-3">
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl shadow-clay-sm transition-transform duration-200 group-hover:scale-105',
                    feature.tint,
                  )}
                >
                  <feature.icon className="size-6" />
                </span>
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary">
                  Explore
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">Recent events</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/events">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {eventsQuery.isPending ? (
          <EventListSkeleton count={4} />
        ) : recentEvents.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {recentEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="No events yet — check back soon." />
        )}
      </section>
    </div>
  )
}
