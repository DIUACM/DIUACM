import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MainLayout from '@/layouts/main-layout';
import type { ContestDetails } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, CalendarDays, ExternalLink, MapPin, Trophy, Users } from 'lucide-react';

type Props = {
    contest: ContestDetails;
};

function formatDate(dateString: string | null) {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function getContestTypeBadgeStyle(type?: string) {
    switch (type) {
        case 'icpc_regional':
            return 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white border-none shadow-sm';
        case 'icpc_asia_west':
            return 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-500 text-white border-none shadow-sm';
        case 'iupc':
            return 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white border-none shadow-sm';
        default:
            return 'bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 text-white border-none shadow-sm';
    }
}

function humanizeContestType(type?: string) {
    switch (type) {
        case 'icpc_regional':
            return 'ICPC Regional';
        case 'icpc_asia_west':
            return 'ICPC Asia West';
        case 'iupc':
            return 'IUPC';
        case 'other':
            return 'Other';
        default:
            return type || 'Contest';
    }
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getRankBadgeColor(rank: number | null) {
    if (!rank) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-none shadow-sm';
    if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 border-none shadow-sm';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white border-none shadow-sm';
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
}

export default function ContestDetailsPage({ contest }: Props) {
    const hasTeams = contest.teams && contest.teams.length > 0;
    const hasGallery = contest.gallery && contest.gallery.images && contest.gallery.images.length > 0;

    return (
        <MainLayout>
            <Head title={contest.name} />

            <section className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/contests">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Contests
                        </Button>
                    </Link>
                </div>

                {/* Contest Header */}
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-4">
                        <h1 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{contest.name}</h1>
                        <Badge className={getContestTypeBadgeStyle(contest.contest_type)}>
                            <Trophy className="mr-1 h-3 w-3" />
                            {humanizeContestType(contest.contest_type)}
                        </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                            <span>{formatDate(contest.date)}</span>
                        </div>

                        {contest.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>{contest.location}</span>
                            </div>
                        )}

                        {hasTeams && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>
                                    {contest.teams!.length} {contest.teams!.length === 1 ? 'Team' : 'Teams'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {contest.description && (
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                            <div
                                className="prose prose-slate max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: contest.description }}
                            />
                        </div>
                    )}

                    {/* Standings URL */}
                    {contest.standings_url && (
                        <div className="mt-4">
                            <a
                                href={contest.standings_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Standings
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    )}

                    {/* Gallery Link */}
                    {contest.gallery && (
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                            <Link
                                href={`/galleries/${contest.gallery.slug}`}
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View Photo Gallery
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Teams Section */}
                {hasTeams && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Participating Teams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {contest.teams!.map((team) => (
                                    <div
                                        key={team.id}
                                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                                    >
                                        {/* Team Header */}
                                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                                                    {team.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {team.rank !== null && (
                                                        <Badge className={getRankBadgeColor(team.rank)}>
                                                            <Trophy className="mr-1 h-3 w-3" />
                                                            Rank #{team.rank}
                                                        </Badge>
                                                    )}
                                                    {team.solve_count !== null && team.solve_count > 0 && (
                                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800/30 dark:bg-green-900/20 dark:text-green-400">
                                                            {team.solve_count} {team.solve_count === 1 ? 'Problem' : 'Problems'} Solved
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team Members */}
                                        <div>
                                            <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Team Members ({team.members.length})
                                            </h4>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                                {team.members.map((member) => (
                                                    <Link
                                                        key={member.id}
                                                        href={`/programmers/${member.username}`}
                                                        className="flex items-center gap-3 rounded-lg bg-white p-3 transition-shadow hover:shadow-md dark:bg-slate-800"
                                                    >
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={member.avatar || undefined} alt={member.name} />
                                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                                                {member.name}
                                                            </p>
                                                            {member.student_id && (
                                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                    {member.student_id}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Teams Message */}
                {!hasTeams && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center">
                                <Users className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                                <p className="text-center text-slate-500 dark:text-slate-400">
                                    No teams have been registered for this contest yet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Gallery Preview */}
                {hasGallery && (
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">Photo Gallery</CardTitle>
                                <Link href={`/galleries/${contest.gallery!.slug}`}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        View All
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {contest.gallery!.images.slice(0, 4).map((image, index) => (
                                    <Link
                                        key={index}
                                        href={`/galleries/${contest.gallery!.slug}`}
                                        className="group relative aspect-square overflow-hidden rounded-lg"
                                    >
                                        <img
                                            src={image.thumbnail}
                                            alt={image.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"></div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </section>
        </MainLayout>
    );
}
