import React from 'react'
import MainLayout from '@/layouts/main-layout'
import { usePage, Link } from '@inertiajs/react'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type TrackerItem = {
  id: number
  title: string
  slug: string
  description: string | null
  ranklists_count: number
}

type PageProps = {
  trackers: TrackerItem[]
}

export default function TrackersIndex() {
  const { props } = usePage<PageProps>()
  const trackers = props.trackers || []

  return (
    <MainLayout title="Contest Trackers">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Contest <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Trackers</span>
          </h1>
          <div className="mx-auto w-20 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-6" />
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Track contest performance and programming rankings for DIU ACM community members
          </p>
        </div>

        {trackers.length > 0 ? (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackers.map((t) => (
                <Link key={t.id} href={`/trackers/${t.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                    <CardContent className="p-6 h-full">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                          </div>
                          <Badge variant="secondary">{t.ranklists_count} lists</Badge>
                        </div>
                        {t.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{t.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-8 md:p-16 text-center transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <BarChart3 className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No trackers found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              There are no contest trackers available yet. Check back soon for ranking updates!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
