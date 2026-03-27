import { Badge } from '@/components/ui/badge';
import type { InternalContest } from '@/types';
import { Link } from '@inertiajs/react';
import { CalendarDays, Clock } from 'lucide-react';

type Props = {
    contest: InternalContest;
};

function formatDate(dateString: string | null) {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(date);
}

function getRegistrationBadge(contest: InternalContest) {
    switch (contest.registration_status) {
        case 'open':
            return <Badge className="bg-green-500 hover:bg-green-600">Registration Open</Badge>;
        case 'upcoming':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Registration Opens Soon</Badge>;
        default:
            return <Badge variant="secondary">Registration Closed</Badge>;
    }
}

export function InternalContestCard({ contest }: Props) {
    return (
        <Link href={`/internal-contests/${contest.slug}`} className="block">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {contest.banner_image && (
                    <div className="aspect-video w-full overflow-hidden">
                        <img
                            src={contest.banner_image}
                            alt={contest.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                )}

                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {contest.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {getRegistrationBadge(contest)}
                            {contest.registration_fee > 0 ? (
                                <Badge variant="outline">Fee: ৳{contest.registration_fee}</Badge>
                            ) : (
                                <Badge variant="outline">Free</Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                            <span>Reg. Deadline: {formatDate(contest.registration_deadline)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>Starts: {formatDate(contest.registration_start_time)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
