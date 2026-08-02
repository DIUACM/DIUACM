import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  Code2,
  FileSpreadsheet,
  GraduationCap,
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
import { EventCard, EventListSkeleton } from '@/features/events/EventCard'
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
    icon: GraduationCap,
    title: 'Free C Programming Course',
    description:
      'Seven recorded classes that take you from your first C program to pointers — watch them right here.',
    to: '/courses',
    tint: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
  },
  {
    icon: FileSpreadsheet,
    title: 'Green Sheet Practice Tracker',
    description:
      'Build the beginner programming foundation needed before DIU ACM’s advanced training.',
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
      <section className="grid items-center gap-10 pt-4 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)] lg:gap-14">
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-clay-sm ring-1 ring-foreground/5">
            <Trophy className="size-4 text-amber-500" />
            ICPC-focused competitive programming lab
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold text-balance sm:text-6xl lg:mx-0">
            DIU&apos;s home for{' '}
            <span className="bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-transparent">
              competitive programming
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground lg:mx-0">
            DIU ACM is the specialized programming lab of the Department of
            CSE—built for ICPC preparation, disciplined practice, and a strong
            problem-solving community.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
        </div>

        <div className="mx-auto w-full max-w-lg overflow-hidden rounded-4xl bg-card p-3 shadow-clay-lg ring-1 ring-foreground/5 sm:p-4">
          <div className="overflow-hidden rounded-3xl bg-[#11131f] shadow-clay-inset ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground shadow-clay-sm ring-1 ring-primary/25">
                  <Code2 className="size-4 text-violet-300" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-100">main.cpp</p>
                  <p className="text-[0.65rem] text-slate-500">DIU ACM starter</p>
                </div>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-cyan-300 ring-1 ring-cyan-300/15">
                C++17
              </span>
            </div>

            <pre className="overflow-x-auto px-3 py-6 text-left font-mono text-[0.72rem] leading-7 sm:px-6 sm:text-[0.84rem]">
              <code className="text-slate-300">
                <span className="text-fuchsia-300">#include</span>{' '}
                <span className="text-amber-200">&lt;bits/stdc++.h&gt;</span>
                {'\n'}
                <span className="text-fuchsia-300">using</span> namespace std;
                {'\n'}
                <span className="text-fuchsia-300">#define</span> ll{' '}
                <span className="text-cyan-300">long long</span>
                {'\n\n'}
                <span className="text-cyan-300">int</span>{' '}
                <span className="text-blue-300">main</span>() {'{'}
                {'\n'}    ios_base::sync_with_stdio(
                <span className="text-amber-200">false</span>);
                {'\n'}    cin.tie(
                <span className="text-violet-300">nullptr</span>);
                {'\n\n'}    cout &lt;&lt;{' '}
                <span className="text-emerald-300">
                  &quot;Welcome to DIUACM!&quot;
                </span>{' '}
                &lt;&lt; endl;
                {'\n'}    <span className="text-fuchsia-300">return</span>{' '}
                <span className="text-amber-200">0</span>;
                {'\n'}{'}'}
              </code>
            </pre>

            <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-400 sm:px-5">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0.6rem_rgba(52,211,153,0.55)]" />
              Ready to compile
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="affiliations-heading"
        className="rounded-4xl bg-card p-5 shadow-clay-lg ring-1 ring-foreground/5 sm:p-7"
      >
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Our affiliation
          </p>
          <h2
            id="affiliations-heading"
            className="mt-1 text-xl font-bold sm:text-2xl"
          >
            One university, one department, one programming community
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex min-h-32 flex-col items-center justify-center rounded-3xl bg-muted/55 p-4 text-center shadow-clay-inset ring-1 ring-foreground/5 dark:bg-input/30 dark:ring-white/10">
            <a
              href="https://daffodilvarsity.edu.bd/"
              target="_blank"
              rel="noreferrer"
              className="flex w-full flex-1 items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none"
              aria-label="Visit Daffodil International University"
            >
              <img
                src="/brands/diu-logo.svg"
                alt="Daffodil International University"
                className="h-16 w-full object-contain dark:brightness-110"
              />
            </a>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Daffodil International University
            </p>
          </div>

          <div className="flex min-h-32 flex-col items-center justify-center rounded-3xl bg-muted/55 p-4 text-center shadow-clay-inset ring-1 ring-foreground/5 dark:bg-input/30 dark:ring-white/10">
            <a
              href="https://daffodilvarsity.edu.bd/department/cse"
              target="_blank"
              rel="noreferrer"
              className="flex w-full flex-1 items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none"
              aria-label="Visit the DIU Department of Computer Science and Engineering"
            >
              <img
                src="/brands/diu-cse-logo.webp"
                alt="DIU Department of CSE"
                className="size-16 object-contain"
              />
            </a>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Department of CSE
            </p>
          </div>

          <div className="flex min-h-32 flex-col items-center justify-center rounded-3xl bg-muted/55 p-4 text-center shadow-clay-inset ring-1 ring-foreground/5 dark:bg-input/30 dark:ring-white/10">
            <div className="flex w-full flex-1 items-center justify-center">
              <img
                src="/brands/diu-acm-logo.png"
                alt="DIU ACM"
                className="size-20 object-contain dark:brightness-125"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              DIU ACM Programming Lab
            </p>
          </div>
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
