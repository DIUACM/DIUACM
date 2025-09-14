import MainLayout from '@/layouts/main-layout'
import { Link, usePage } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Code, Star, Trophy, Calendar, ExternalLink, Github, Linkedin, Globe, Mail, Phone, DollarSign, Users, Award } from 'lucide-react'

type Programmer = {
    id: number
    name: string
    username: string
    email: string
    image?: string | null
    bio?: string | null
    skills?: string[] | null
    location?: string | null
    max_cf_rating?: number | null
    codeforces_handle?: string | null
    atcoder_handle?: string | null
    vjudge_handle?: string | null
    experience_years?: number | null
    is_available_for_hire: boolean
    hourly_rate?: number | null
    github_handle?: string | null
    linkedin_handle?: string | null
    website?: string | null
    department?: string | null
    student_id?: string | null
    preferred_languages?: string[] | null
    created_at: string
    attended_events?: Array<{
        id: number
        title: string
        starting_at: string
        ending_at: string
        type: string
    }>
    rank_lists?: Array<{
        id: number
        title: string
        pivot: {
            score: number
        }
    }>
    event_user_stats?: Array<{
        id: number
        solves_count: number
        upsolves_count: number
        participation: string
        event: {
            id: number
            title: string
        }
    }>
}

type PageProps = {
    programmer: Programmer
}

function ContactInfo({ programmer }: { programmer: Programmer }) {
    const contactItems = []

    if (programmer.email) {
        contactItems.push({
            icon: Mail,
            label: 'Email',
            value: programmer.email,
            href: `mailto:${programmer.email}`,
        })
    }

    if (programmer.phone) {
        contactItems.push({
            icon: Phone,
            label: 'Phone',
            value: programmer.phone,
            href: `tel:${programmer.phone}`,
        })
    }

    if (programmer.github_handle) {
        contactItems.push({
            icon: Github,
            label: 'GitHub',
            value: `@${programmer.github_handle}`,
            href: `https://github.com/${programmer.github_handle}`,
        })
    }

    if (programmer.linkedin_handle) {
        contactItems.push({
            icon: Linkedin,
            label: 'LinkedIn',
            value: `@${programmer.linkedin_handle}`,
            href: `https://linkedin.com/in/${programmer.linkedin_handle}`,
        })
    }

    if (programmer.website) {
        contactItems.push({
            icon: Globe,
            label: 'Website',
            value: new URL(programmer.website).hostname,
            href: programmer.website,
        })
    }

    if (contactItems.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {contactItems.map((item) => (
                        <div key={item.label} className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                                    >
                                        {item.value}
                                    </a>
                                ) : (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{item.value}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function CompetitiveProgrammingInfo({ programmer }: { programmer: Programmer }) {
    const hasCompetitiveInfo = programmer.codeforces_handle || programmer.atcoder_handle || programmer.vjudge_handle || programmer.max_cf_rating

    if (!hasCompetitiveInfo) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Competitive Programming
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {programmer.max_cf_rating && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Codeforces Rating</span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30">
                                {programmer.max_cf_rating}
                            </Badge>
                        </div>
                    )}

                    <div className="space-y-2">
                        {programmer.codeforces_handle && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Codeforces</span>
                                <a
                                    href={`https://codeforces.com/profile/${programmer.codeforces_handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                    {programmer.codeforces_handle}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </div>
                        )}

                        {programmer.atcoder_handle && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">AtCoder</span>
                                <a
                                    href={`https://atcoder.jp/users/${programmer.atcoder_handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                    {programmer.atcoder_handle}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </div>
                        )}

                        {programmer.vjudge_handle && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">VJudge</span>
                                <a
                                    href={`https://vjudge.net/user/${programmer.vjudge_handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                    {programmer.vjudge_handle}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SkillsAndLanguages({ programmer }: { programmer: Programmer }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Skills & Languages
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {programmer.skills && programmer.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {programmer.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {programmer.preferred_languages && programmer.preferred_languages.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preferred Languages</h4>
                            <div className="flex flex-wrap gap-2">
                                {programmer.preferred_languages.map((language) => (
                                    <Badge key={language} variant="outline">
                                        {language}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function EventsAndStats({ programmer }: { programmer: Programmer }) {
    const hasEvents = programmer.attended_events && programmer.attended_events.length > 0
    const hasStats = programmer.event_user_stats && programmer.event_user_stats.length > 0
    const hasRankLists = programmer.rank_lists && programmer.rank_lists.length > 0

    if (!hasEvents && !hasStats && !hasRankLists) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Events & Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {hasEvents && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Attended Events ({programmer.attended_events?.length})
                            </h4>
                            <div className="space-y-2">
                                {programmer.attended_events?.slice(0, 5).map((event) => (
                                    <div key={event.id} className="flex items-center justify-between text-sm">
                                        <Link
                                            href={`/events/${event.id}`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                        >
                                            {event.title}
                                        </Link>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                                            {new Date(event.starting_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                                {(programmer.attended_events?.length || 0) > 5 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        +{(programmer.attended_events?.length || 0) - 5} more events
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {hasRankLists && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Rank Lists ({programmer.rank_lists?.length})
                            </h4>
                            <div className="space-y-2">
                                {programmer.rank_lists?.slice(0, 3).map((rankList) => (
                                    <div key={rankList.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate">{rankList.title}</span>
                                        <Badge variant="outline" className="ml-2">
                                            {rankList.pivot.score}
                                        </Badge>
                                    </div>
                                ))}
                                {(programmer.rank_lists?.length || 0) > 3 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        +{(programmer.rank_lists?.length || 0) - 3} more rank lists
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {hasStats && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Event Statistics ({programmer.event_user_stats?.length})
                            </h4>
                            <div className="space-y-2">
                                {programmer.event_user_stats?.slice(0, 3).map((stat) => (
                                    <div key={stat.id} className="text-sm">
                                        <div className="flex items-center justify-between">
                                            <Link
                                                href={`/events/${stat.event.id}`}
                                                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                            >
                                                {stat.event.title}
                                            </Link>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <span>Solves: {stat.solves_count}</span>
                                            <span>Upsolves: {stat.upsolves_count}</span>
                                        </div>
                                    </div>
                                ))}
                                {(programmer.event_user_stats?.length || 0) > 3 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        +{(programmer.event_user_stats?.length || 0) - 3} more statistics
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProgrammerShow() {
    const { props } = usePage<PageProps>()
    const { programmer } = props

    return (
        <MainLayout title={`${programmer.name} - Programmers`}>
            <div className="container mx-auto px-4 py-16">
                <div className="mb-6">
                    <Link
                        href="/programmers"
                        className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Programmers
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Header */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-6">
                                    <div className="flex-shrink-0">
                                        {programmer.image ? (
                                            <img
                                                src={programmer.image}
                                                alt={programmer.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                                {programmer.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {programmer.name}
                                                </h1>
                                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                                    @{programmer.username}
                                                </p>
                                                {programmer.location && (
                                                    <div className="flex items-center mt-2 text-slate-500 dark:text-slate-400">
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        {programmer.location}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                {programmer.is_available_for_hire && (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                        Available for Hire
                                                    </Badge>
                                                )}
                                                {programmer.hourly_rate && (
                                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                                        <DollarSign className="h-4 w-4 mr-1" />
                                                        ${programmer.hourly_rate}/hr
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {programmer.bio && (
                                            <div className="mt-4">
                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {programmer.bio}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-500 dark:text-slate-400">
                                            {programmer.experience_years && (
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {programmer.experience_years} years experience
                                                </div>
                                            )}
                                            {programmer.department && (
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    {programmer.department}
                                                </div>
                                            )}
                                            {programmer.student_id && (
                                                <div className="flex items-center">
                                                    <Star className="h-4 w-4 mr-1" />
                                                    ID: {programmer.student_id}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <SkillsAndLanguages programmer={programmer} />
                        <EventsAndStats programmer={programmer} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <ContactInfo programmer={programmer} />
                        <CompetitiveProgrammingInfo programmer={programmer} />
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}