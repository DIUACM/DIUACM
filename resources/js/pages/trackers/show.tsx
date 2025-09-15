import React from 'react'
import MainLayout from '@/layouts/main-layout'
import { usePage, Link } from '@inertiajs/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart3, Info, Users, TrendingUp, Shield } from 'lucide-react'

type Tracker = {
  id: number
  title: string
  slug: string
  description: string | null
}

type EventCol = {
  id: number
  title: string
  starting_at: string
  weight: number
  open_for_attendance: boolean
  strict_attendance: boolean
}

type UserRow = {
  id: number
  name: string
  username: string | null
  image_url: string
  score: number
  solve_stats: Array<{
    event_id: number
    participation: boolean | null
    solve_count: number
    upsolve_count: number
  }>
}

type RankList = {
  id: number
  keyword: string | null
  description: string | null
  weight_of_upsolve: number
  consider_strict_attendance: boolean
  event_count: number
  user_count: number
  events: EventCol[]
  users: UserRow[]
}

type NotFoundState = {
  type: 'ranklist_not_found'
  requested_keyword: string
  available_ranklists: Array<{ id: number; keyword: string | null; description: string | null }>
}

type PageProps = {
  tracker: Tracker
  current_ranklist?: RankList
  all_ranklist_keywords?: string[]
  attendance_map?: Record<string, boolean>
  not_found?: NotFoundState
}

function RankListNotFound({ tracker, nf }: { tracker: Tracker; nf: NotFoundState }) {
  return (
    <MainLayout title={`${tracker.title} - Tracker`}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{tracker.title}</h1>
              <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  The rank list "{nf.requested_keyword}" was not found for this tracker.
                </p>
              </div>
              {nf.available_ranklists.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Available Rankings</h3>
                  <div className="flex flex-wrap gap-2">
                    {nf.available_ranklists.map((r) => (
                      <Link key={r.id} href={`/trackers/${tracker.slug}${r.keyword ? `/${encodeURIComponent(r.keyword)}` : ''}`}>
                        <Button variant="outline" size="sm">{r.keyword || 'Main'}</Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function TrackerShow() {
  const { props } = usePage<PageProps>()

  if (props.not_found) {
    return <RankListNotFound tracker={props.tracker} nf={props.not_found} />
  }

  const tracker = props.tracker
  const ranklist = props.current_ranklist as RankList
  const allKeywords = props.all_ranklist_keywords || []
  const attendanceMap = props.attendance_map || {}

  return (
    <MainLayout title={`${tracker.title} - Tracker`}>
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tracker.title}</h1>
          {tracker.description && (
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{tracker.description}</p>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {allKeywords.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Available Rankings</h3>
                  <div className="flex flex-wrap gap-2">
                    {allKeywords.map((k) => {
                      const isActive = (k || null) === (ranklist.keyword || null)
                      const href = `/trackers/${tracker.slug}${k ? `/${encodeURIComponent(k)}` : ''}`
                      return (
                        <Link key={k || 'main'} href={href}>
                          <Button variant={isActive ? 'default' : 'outline'} size="sm" className={isActive ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                            {k || 'Main'}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users:</span>
                  {ranklist.user_count}
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Events:</span>
                  {ranklist.event_count}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-xl font-semibold">Rankings</h2>
          </div>

          {ranklist.users.length === 0 || ranklist.events.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4">
                <BarChart3 className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No data available</h3>
              <p className="text-slate-600 dark:text-slate-400">This ranklist doesn't have any data to display yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <RankingTable rankList={ranklist} attendanceMap={attendanceMap} />
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <h4 className="font-semibold mb-2">Scoring Information</h4>
                    <div className="space-y-2 text-slate-600 dark:text-slate-400">
                      <p>• Scores are calculated based on solves and upsolves.</p>
                      <p>• Upsolve weight: <span className="font-medium text-slate-900 dark:text-white">{ranklist.weight_of_upsolve}</span></p>
                      <p>• Event weights are shown under each event title.</p>
                      {ranklist.consider_strict_attendance && (
                        <p>• Strict Attendance: Events marked as SA require attendance. Without attendance, solves count as upsolves.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

function RankingTable({ rankList, attendanceMap }: { rankList: Pick<RankList, 'events' | 'users' | 'consider_strict_attendance'>; attendanceMap: Record<string, boolean> }) {
  return (
    <div className="space-y-4">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                <th className="sticky left-16 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                {rankList.events.map((event) => (
                  <th key={event.id} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-48">
                    <div className="space-y-1">
                      <Link href={`/events/${event.id}`} target="_blank" className="block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate" title={event.title}>
                        {event.title.length > 30 ? `${event.title.substring(0, 30)}...` : event.title}
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(event.starting_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge variant="secondary" className="text-xs">W: {event.weight ?? 1}</Badge>
                        {rankList.consider_strict_attendance && event.open_for_attendance && event.strict_attendance && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" title="Strict attendance enforced">
                            <Shield className="h-3 w-3 mr-1" /> SA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {rankList.users.map((user, index) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{index + 1}</td>
                  <td className="sticky left-16 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-3">
                    <Link href={user.username ? `/programmers/${user.username}` : '#'} className="flex items-center gap-3 hover:opacity-80">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image_url || ''} alt={user.name} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {user.name.length > 20 ? `${user.name.substring(0, 20)}...` : user.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{user.score.toFixed(1)}</td>
                  {rankList.events.map((event) => {
                    const st = user.solve_stats.find(s => s.event_id === event.id)
                    const strict = rankList.consider_strict_attendance && event.open_for_attendance && event.strict_attendance
                    const hasAttendance = !strict || attendanceMap[`${user.id}_${event.id}`]

                    return (
                      <td key={event.id} className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {!st ? (
                            <Badge variant="secondary" className="text-xs">No data</Badge>
                          ) : !st.participation ? (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Absent</Badge>
                          ) : strict && !hasAttendance ? (
                            <>
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Absent</Badge>
                              {st.solve_count + (st.upsolve_count ?? 0) > 0 && (
                                <Badge variant="secondary" className="text-xs">{st.solve_count + (st.upsolve_count ?? 0)} Upsolve</Badge>
                              )}
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">{st.solve_count} Solve</Badge>
                              {(st.upsolve_count ?? 0) > 0 && (
                                <Badge variant="secondary" className="text-xs">{st.upsolve_count ?? 0} Upsolve</Badge>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
