import { Link } from 'react-router'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDate } from '@/lib/datetime'
import type { RanklistStanding, RanklistUserPerformance } from '@/api/types'
import { cn } from '@/lib/utils'

function rankStyle(rank: number): string {
  if (rank === 1) return 'text-amber-500 dark:text-amber-400'
  if (rank === 2) return 'text-zinc-400'
  if (rank === 3) return 'text-orange-600 dark:text-orange-500'
  return 'text-muted-foreground'
}

function PerformanceCell({ entry }: { entry: RanklistUserPerformance | undefined }) {
  if (!entry) {
    return <span className="text-muted-foreground/40">—</span>
  }
  return (
    <div className="leading-tight">
      <span className="font-medium">{entry.solveCount}</span>
      {entry.upsolveCount > 0 && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {' '}
          +{entry.upsolveCount}
        </span>
      )}
      {entry.position !== null && (
        <div className="text-[11px] text-muted-foreground">#{entry.position}</div>
      )}
    </div>
  )
}

export function StandingsTable({
  standings,
}: {
  standings: { events: { id: number; title: string; startingAt: number; weight: number }[]; users: RanklistStanding[] }
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
            <th className="sticky left-0 z-10 w-12 bg-muted/50 px-3 py-3 text-center font-medium backdrop-blur">
              #
            </th>
            <th className="sticky left-12 z-10 min-w-44 bg-muted/50 px-3 py-3 font-medium backdrop-blur">
              Participant
            </th>
            <th className="px-3 py-3 text-right font-medium">Score</th>
            {standings.events.map((event) => (
              <th key={event.id} className="min-w-28 px-3 py-2 align-top font-medium">
                <Link
                  to={`/events/${event.id}`}
                  className="block max-w-36 truncate text-foreground hover:underline"
                  title={event.title}
                >
                  {event.title}
                </Link>
                <div className="mt-0.5 text-[11px] font-normal">
                  {formatDate(event.startingAt)} · w {event.weight}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.users.map((standing) => {
            const byEvent = new Map(
              standing.performance.map((entry) => [entry.eventId, entry]),
            )
            return (
              <tr
                key={standing.user.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                <td
                  className={cn(
                    'sticky left-0 z-10 bg-background px-3 py-2.5 text-center font-bold',
                    rankStyle(standing.rank),
                  )}
                >
                  {standing.rank}
                </td>
                <td className="sticky left-12 z-10 bg-background px-3 py-2.5">
                  <Link
                    to={`/programmers/${standing.user.username}`}
                    className="flex items-center gap-2.5 hover:underline"
                  >
                    <UserAvatar
                      name={standing.user.name}
                      image={standing.user.image}
                      className="size-7"
                    />
                    <span className="max-w-40 truncate font-medium">
                      {standing.user.name}
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {standing.score.toFixed(2)}
                </td>
                {standings.events.map((event) => (
                  <td key={event.id} className="px-3 py-2.5">
                    <PerformanceCell entry={byEvent.get(event.id)} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
