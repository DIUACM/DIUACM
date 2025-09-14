import MainLayout from '@/layouts/main-layout'
import { Link, usePage, router } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search as SearchIcon, MapPin, Code, Star, ExternalLink, Users, Trophy, Calendar } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type React from 'react'

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
    experience_years?: number | null
    is_available_for_hire: boolean
    hourly_rate?: number | null
    github_handle?: string | null
    linkedin_handle?: string | null
    website?: string | null
    created_at: string
}

type PageProps = {
    programmers: Programmer[]
    pagination: { page: number; pages: number; total: number; limit: number }
    filters: { 
        search?: string | null
        skills?: string | null
        location?: string | null
        available_for_hire?: boolean | null
    }
}

function ProgrammerCard({ programmer }: { programmer: Programmer }) {
    const skills = programmer.skills?.slice(0, 3) || []
    const hasMoreSkills = (programmer.skills?.length || 0) > 3

    return (
        <Link href={`/programmers/${programmer.id}`} className="block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-slate-200 dark:border-slate-700">
                <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0">
                            {programmer.image ? (
                                <img
                                    src={programmer.image}
                                    alt={programmer.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                    {programmer.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                {programmer.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                @{programmer.username}
                            </p>
                            {programmer.location && (
                                <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {programmer.location}
                                </div>
                            )}
                        </div>
                        {programmer.is_available_for_hire && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
                                Available
                            </Badge>
                        )}
                    </div>

                    {programmer.bio && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                            {programmer.bio}
                        </p>
                    )}

                    <div className="space-y-3">
                        {skills.length > 0 && (
                            <div>
                                <div className="flex flex-wrap gap-1">
                                    {skills.map((skill) => (
                                        <Badge key={skill} variant="secondary" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {hasMoreSkills && (
                                        <Badge variant="outline" className="text-xs">
                                            +{(programmer.skills?.length || 0) - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-4">
                                {programmer.max_cf_rating && (
                                    <div className="flex items-center">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        CF: {programmer.max_cf_rating}
                                    </div>
                                )}
                                {programmer.experience_years && (
                                    <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {programmer.experience_years}y exp
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                <ExternalLink className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function ProgrammersFilters({ current }: { current: PageProps['filters'] }) {
    const [search, setSearch] = useState<string>(current.search ?? '')
    const [skills, setSkills] = useState<string>(current.skills ?? '')
    const [location, setLocation] = useState<string>(current.location ?? '')
    const [availableForHire, setAvailableForHire] = useState<boolean>(current.available_for_hire ?? false)
    const mounted = useRef(false)

    useEffect(() => {
        setSearch(current.search ?? '')
        setSkills(current.skills ?? '')
        setLocation(current.location ?? '')
        setAvailableForHire(current.available_for_hire ?? false)
    }, [current])

    const applyFilters = () => {
        const data: Record<string, any> = {}
        if (search.trim()) data.search = search.trim()
        if (skills.trim()) data.skills = skills.trim()
        if (location.trim()) data.location = location.trim()
        if (availableForHire) data.available_for_hire = true

        router.get(window.location.pathname, data, {
            replace: true,
            preserveScroll: true,
            preserveState: true,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setSkills('')
        setLocation('')
        setAvailableForHire(false)
        router.get(window.location.pathname, {}, {
            replace: true,
            preserveScroll: true,
            preserveState: true,
        })
    }

    // Debounced search
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            return
        }
        const id = setTimeout(() => {
            applyFilters()
        }, 500)
        return () => clearTimeout(id)
    }, [search])

    const hasActiveFilters = search || skills || location || availableForHire

    return (
        <Card className="border-slate-200 dark:border-slate-700 mb-6">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Input
                                type="search"
                                placeholder="Search programmers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-10"
                            />
                            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                            placeholder="Skills (comma separated)"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                        />
                        <Input
                            placeholder="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="available"
                                checked={availableForHire}
                                onChange={(e) => setAvailableForHire(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <label htmlFor="available" className="text-sm text-slate-700 dark:text-slate-300">
                                Available for hire
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button onClick={applyFilters} size="sm">
                            Apply Filters
                        </Button>
                        {hasActiveFilters && (
                            <Button onClick={clearFilters} variant="outline" size="sm">
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function Pager({ page, pages, filters }: { page: number; pages: number; filters?: PageProps['filters'] }) {
    const go = (n: number) => {
        const data: Record<string, any> = { page: n }
        if (filters?.search) data.search = filters.search
        if (filters?.skills) data.skills = filters.skills
        if (filters?.location) data.location = filters.location
        if (filters?.available_for_hire) data.available_for_hire = filters.available_for_hire

        router.get(window.location.pathname, data, {
            preserveScroll: true,
            preserveState: true,
            replace: false,
        })
    }

    if (pages <= 1) return null

    const items = [] as React.ReactElement[]
    const maxVisible = 5

    items.push(
        <PaginationItem key="first">
            <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(1))} isActive={page === 1}>
                1
            </PaginationLink>
        </PaginationItem>,
    )

    if (page > 3) items.push(<PaginationItem key="es"><PaginationEllipsis /></PaginationItem>)

    let start = Math.max(2, page - 1)
    let end = Math.min(pages - 1, page + 1)
    if (page <= 3) end = Math.min(pages - 1, maxVisible - 1)
    if (page >= pages - 2) start = Math.max(2, pages - (maxVisible - 2))

    for (let i = start; i <= end; i++) {
        items.push(
            <PaginationItem key={i}>
                <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(i))} isActive={page === i}>
                    {i}
                </PaginationLink>
            </PaginationItem>,
        )
    }

    if (page < pages - 2) items.push(<PaginationItem key="ee"><PaginationEllipsis /></PaginationItem>)

    if (pages > 1) {
        items.push(
            <PaginationItem key="last">
                <PaginationLink href="#" onClick={(e) => (e.preventDefault(), go(pages))} isActive={page === pages}>
                    {pages}
                </PaginationLink>
            </PaginationItem>,
        )
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            if (page > 1) go(page - 1)
                        }}
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={page === 1 ? -1 : 0}
                    />
                </PaginationItem>
                {items}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            if (page < pages) go(page + 1)
                        }}
                        aria-disabled={page === pages}
                        className={page === pages ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={page === pages ? -1 : 0}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}

export default function ProgrammersIndex() {
    const { props } = usePage<PageProps>()
    const { programmers, pagination, filters } = props

    const hasResults = programmers.length > 0
    const hasActiveFilters = !!(filters.search || filters.skills || filters.location || filters.available_for_hire)

    return (
        <MainLayout title="Programmers">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Programmers</h1>
                    <p className="text-slate-600 dark:text-slate-300">Discover talented programmers and connect with the community</p>
                </div>

                <ProgrammersFilters current={filters} />

                <div className="mb-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                                    <Users className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    {pagination.total} {pagination.total === 1 ? 'Programmer' : 'Programmers'}{hasActiveFilters ? ' found' : ''}
                                </h2>
                                {hasActiveFilters && pagination.total > 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Showing page {pagination.page} of {pagination.pages}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {hasResults ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {programmers.map((programmer) => (
                                <ProgrammerCard key={programmer.id} programmer={programmer} />
                            ))}
                        </div>
                        {pagination.pages > 1 && (
                            <div className="flex justify-center">
                                <Pager page={pagination.page} pages={pagination.pages} filters={filters} />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-8 md:p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                            <SearchIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No programmers found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            {hasActiveFilters ? 'Try adjusting your filters to find more programmers.' : 'There are no programmers in the database yet.'}
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}