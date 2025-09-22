import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, BarChart3 } from 'lucide-react';

export type TrackerListItem = {
    id: number;
    title: string;
    slug: string;
    description: string;
};

type Props = {
    tracker: TrackerListItem;
};

export function TrackerCard({ tracker }: Props) {
    return (
        <Link href={`/trackers/${tracker.slug}`} className="block">
            <Card className="group relative overflow-hidden border-slate-200 bg-white transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-slate-50 opacity-50 dark:from-slate-800 dark:to-slate-900"></div>
                <div className="absolute -right-10 -bottom-10 -z-10 h-24 w-24 rounded-full bg-blue-100/40 dark:bg-blue-900/20"></div>

                <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                            </div>

                            <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {tracker.title}
                            </CardTitle>

                            {tracker.description && <CardDescription className="line-clamp-3">{tracker.description}</CardDescription>}
                        </div>
                    </div>

                    <CardAction>
                        <div className="flex h-8 w-8 transform items-center justify-center rounded-full bg-blue-100 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 dark:bg-blue-900/50">
                            <ArrowUpRight className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>
                    </CardAction>
                </CardHeader>
            </Card>
        </Link>
    );
}
