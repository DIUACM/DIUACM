import React from 'react'
import MainLayout from '@/layouts/main-layout'
import { usePage, Link } from '@inertiajs/react'
import { BarChart3, Calendar, Trophy, Users, ArrowLeft, TrendingUp, Info, Shield } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type EventStat = {
  solves_count: number
  upsolves_count: number
  participation: boolean
} | null

type Event = {
  id: number
  title: string
  starting_at: string
  strict_attendance?: boolean
}

type User = {
  id: number
  name: string
  username: string
  image_url: string | null
  score: number
  event_stats: Record<number, EventStat>
}

type RankList = {
  id: number
  keyword: string
  consider_strict_attendance: boolean
  events: Event[]
  users: User[]
}

type Tracker = {
  id: number
  title: string
  slug: string
  rankLists: Array<{
    id: number
    keyword: string
  }>
}

type PageProps = {
  tracker: Tracker
  selectedRankList: RankList | null
}

function StatCell({ stat, event, isStrictEvent }: { stat: EventStat; event?: Event; isStrictEvent?: boolean }) {
  if (stat === null) {
    return (
      <div className="px-4 py-3">
        <Badge variant="secondary" className="text-xs">
          No data
        </Badge>
      </div>
    )
  }

  const { solves_count, upsolves_count, participation } = stat

  return (
    <div className="px-4 py-3">
      <div className="flex gap-2 flex-wrap">
        {!participation ? (
          <Badge
            variant="outline"
            className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            Absent
          </Badge>
        ) : (
          <>
            <Badge
              variant="outline"
              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              {solves_count} Solve{solves_count !== 1 ? 's' : ''}
            </Badge>
            {upsolves_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {upsolves_count} Upsolve{upsolves_count !== 1 ? 's' : ''}
              </Badge>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function TrackersShow() {
  const { props } = usePage<PageProps>()
  const { tracker, selectedRankList } = props

  if (!selectedRankList) {
    return (
      <MainLayout title={tracker.title}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{tracker.title}</h1>
            <p className="text-slate-600 dark:text-slate-300">No rank list available</p>
            <Link href="/trackers" className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Trackers
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const events = selectedRankList.events
  const users = selectedRankList.users

  return (
    <MainLayout title={`${tracker.title} - ${selectedRankList.keyword}`}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center lg:text-left">
            <Link href="/trackers" className="inline-flex items-center gap-2 mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Trackers
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {tracker.title}
            </h1>
          </div>

          {/* Ranklist Navigation and Stats */}
          <Card>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Ranklist Navigation */}
                {tracker.rankLists.length > 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Available Rankings
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tracker.rankLists.map((rankList) => {
                        const isActive = rankList.id === selectedRankList.id
                        const href = `/trackers/${tracker.slug}/${rankList.keyword}`

                        return (
                          <Link key={rankList.id} href={href}>
                            <Button
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className={
                                isActive ? "bg-blue-600 hover:bg-blue-700" : ""
                              }
                            >
                              {rankList.keyword}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users:</span>
                    {users.length}
                  </Badge>

                  <Badge variant="secondary" className="gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Events:</span>
                    {events.length}
                  </Badge>

                  {selectedRankList.consider_strict_attendance && (
                    <Badge variant="outline" className="gap-1.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Strict Attendance</span>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Table */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Rankings
              </h2>
            </div>

            {users.length === 0 || events.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4">
                  <BarChart3 className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  No data available
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  This ranklist doesn&apos;t have any data to display yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Table */}
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      {/* Table Header */}
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="sticky left-16 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Score
                          </th>
                          {events.map((event) => (
                            <th
                              key={event.id}
                              className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-48"
                            >
                              <div className="space-y-1">
                                <div
                                  className="block text-xs font-semibold text-blue-600 dark:text-blue-400 truncate"
                                  title={event.title}
                                >
                                  {event.title.length > 30
                                    ? `${event.title.substring(0, 30)}...`
                                    : event.title}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(event.starting_at).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )}
                                  </span>
                                  {selectedRankList.consider_strict_attendance &&
                                    event.strict_attendance && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                                        title="Strict attendance enforced"
                                      >
                                        <Shield className="h-3 w-3 mr-1" />
                                        SA
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map((user, index) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            {/* Rank */}
                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              {index + 1}
                            </td>

                            {/* User */}
                            <td className="sticky left-16 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.image_url || ""} alt={user.name} />
                                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {user.name.length > 20
                                    ? `${user.name.substring(0, 20)}...`
                                    : user.name}
                                </span>
                              </div>
                            </td>

                            {/* Score */}
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                              {typeof user.score === 'number' ? user.score.toFixed(1) : user.score}
                            </td>

                            {/* Event Scores */}
                            {events.map((event) => (
                              <td key={event.id}>
                                <StatCell 
                                  stat={user.event_stats[event.id] || null} 
                                  event={event}
                                  isStrictEvent={selectedRankList.consider_strict_attendance && event.strict_attendance}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scoring Information */}
                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Scoring Information
                      </h4>
                      <div className="space-y-2 text-slate-600 dark:text-slate-400">
                        <p>
                          • Scores are calculated based on solve performance and upsolve counts
                        </p>
                        <p>• Rankings are sorted by total score in descending order</p>
                        {selectedRankList.consider_strict_attendance && (
                          <p>
                            •{" "}
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              Strict Attendance:
                            </span>{" "}
                            Events marked with &quot;SA&quot; require attendance.
                            Users without attendance will have their solves counted
                            as upsolves only.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}