import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Building2, Code, Hash, Trophy, User as UserIcon } from 'lucide-react';

export type ProgrammerListItem = {
    id: number;
    name: string;
    username: string;
    student_id: string;
    department: string;
    max_cf_rating: number | null;
    profile_picture: string;
};

type Props = {
    programmer: ProgrammerListItem;
};

export function ProgrammerCard({ programmer }: Props) {
    return (
        <Link href={`/programmers/${programmer.username}`} className="block">
            <Card className="group relative overflow-hidden border-slate-200 bg-white transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>

                <CardContent className="relative z-10 p-4">
                    <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition-all group-hover:ring-blue-300 dark:bg-slate-800 dark:ring-slate-700 dark:group-hover:ring-blue-600">
                                {programmer.profile_picture ? (
                                    <img
                                        src={programmer.profile_picture}
                                        alt={`${programmer.name}'s profile`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                            {/* Name and Username */}
                            <div className="mb-2">
                                <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                                    {programmer.name}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Code className="h-3 w-3" />
                                    <span className="truncate">@{programmer.username}</span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="mb-2 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                {programmer.student_id && (
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3 text-slate-400" />
                                        <span className="truncate">{programmer.student_id}</span>
                                    </div>
                                )}

                                {programmer.department && (
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3 text-slate-400" />
                                        <span className="truncate">{programmer.department}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-500 dark:text-slate-400">Max CF Rating</div>
                                <div className="flex items-center gap-1">
                                    {programmer.max_cf_rating && programmer.max_cf_rating > 0 ? (
                                        <>
                                            <Trophy className="h-3 w-3 text-yellow-500" />
                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {programmer.max_cf_rating.toLocaleString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">N/A</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
