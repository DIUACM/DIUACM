import { Code, Trophy, User as UserIcon, Hash, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

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
            <Card className="group relative overflow-hidden transition-all hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>

                <CardContent className="p-4 relative z-10">
                    <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all">
                                {programmer.profile_picture ? (
                                    <img
                                        src={programmer.profile_picture}
                                        alt={`${programmer.name}'s profile`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <UserIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Name and Username */}
                            <div className="mb-2">
                                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {programmer.name}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Code className="w-3 h-3" />
                                    <span className="truncate">@{programmer.username}</span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mb-2">
                                {programmer.student_id && (
                                    <div className="flex items-center gap-1">
                                        <Hash className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{programmer.student_id}</span>
                                    </div>
                                )}
                                
                                {programmer.department && (
                                    <div className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{programmer.department}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Max CF Rating
                                </div>
                                <div className="flex items-center gap-1">
                                    {programmer.max_cf_rating && programmer.max_cf_rating > 0 ? (
                                        <>
                                            <Trophy className="w-3 h-3 text-yellow-500" />
                                            <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">
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