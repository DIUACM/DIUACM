import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  Trophy,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'
import { useEvents } from '@/api/queries/events'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { EventCard, EventListSkeleton } from '@/features/events/EventsPage'
import { useDocumentTitle } from '@/lib/use-document-title'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Events',
    description:
      'Onsite and online contests, take-home classes, and community meetups — all in one calendar.',
    to: '/events',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'Trackers',
    description:
      'Season-long ranklists that score every contest with weights, solves, and upsolves.',
    to: '/trackers',
  },
  {
    icon: Users,
    title: 'Programmers',
    description:
      'Browse member profiles with Codeforces, VJudge, and AtCoder handles and ratings.',
    to: '/programmers',
  },
]

export function HomePage() {
  useDocumentTitle()
  const { isAuthenticated } = useAuth()
  const eventsQuery = useEvents({ page: 1 })
  const recentEvents = eventsQuery.data?.data.slice(0, 4) ?? []

  return (
    <div className="space-y-16">
      <section className="pt-8 text-center sm:pt-16">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Trophy className="size-4 text-amber-500" />
          Daffodil International University
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          The competitive programming community of DIU
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Compete in contests, climb the ranklists, and grow with programmers
          who love solving problems as much as you do.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link to="/events">
                Browse events <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/login">
                  Join the community <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/events">Browse events</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link key={feature.to} to={feature.to} className="group block">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h2 className="text-lg font-semibold group-hover:underline">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {eventsQuery.isPending ? (
          <EventListSkeleton count={4} />
        ) : recentEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No events yet — check back soon.</p>
        )}
      </section>
    </div>
  )
}
