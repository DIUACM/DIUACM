import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Filter, Search as SearchIcon, Trophy, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const CONTEST_TYPES = [
    { id: 'icpc_regional', name: 'ICPC Regional', icon: '🌍' },
    { id: 'icpc_asia_west', name: 'ICPC Asia West', icon: '🗺️' },
    { id: 'iupc', name: 'IUPC', icon: '👥' },
    { id: 'other', name: 'Other', icon: '📋' },
];

type ContestFiltersProps = {
    filters: {
        search?: string;
        contest_type?: string;
    };
};

export function ContestFilters({ filters }: ContestFiltersProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const hasActiveFilters = !!(filters.contest_type || filters.search);

    const createQueryString = useCallback((name: string, value: string | null) => {
        const url = new URL(window.location.href);
        if (value === null) {
            url.searchParams.delete(name);
        } else {
            url.searchParams.set(name, value);
        }
        url.searchParams.delete('page'); // Reset to first page when filtering
        return url.toString();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const newUrl = createQueryString('search', searchQuery || null);
        router.visit(newUrl, { preserveState: true, preserveScroll: true });
    };

    const handleSelectChange = (name: 'contest_type', value: string | null) => {
        const newUrl = createQueryString(name, value);
        router.visit(newUrl, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        setSearchQuery(filters.search || '');
    }, [filters.search]);

    const clearAllFilters = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('contest_type');
        url.searchParams.delete('page');
        router.visit(url.toString(), { preserveState: true, preserveScroll: true });
        setSearchQuery('');
    };

    return (
        <div>
            <Card className="mb-4 border-slate-200 dark:border-slate-700">
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="w-full md:flex-1">
                                <form onSubmit={handleSearch} className="relative">
                                    <Input
                                        placeholder="Search contests by name, location, or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pr-10"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <SearchIcon className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Select
                                    value={filters.contest_type || 'all'}
                                    onValueChange={(value) => handleSelectChange('contest_type', value === 'all' ? null : value)}
                                >
                                    <SelectTrigger className="w-[180px] md:w-[200px]">
                                        <div className="flex items-center overflow-hidden">
                                            <Trophy className="mr-2 h-4 w-4 flex-shrink-0 text-slate-500" />
                                            <SelectValue className="truncate" placeholder="Contest Type" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] overflow-y-auto">
                                        <SelectItem value="all">All Contest Types</SelectItem>
                                        {CONTEST_TYPES.map((type) => (
                                            <SelectItem key={type.id} value={type.id} className="truncate">
                                                <span className="flex max-w-full items-center">
                                                    <span className="mr-1">{type.icon}</span>
                                                    <span className="truncate">{type.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Filter className="mr-1 h-3 w-3" />
                                Filters:
                            </span>

                            {filters.search && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    {`"${filters.search}"`}
                                </Badge>
                            )}

                            {filters.contest_type && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                    {CONTEST_TYPES.find((c) => c.id === filters.contest_type)?.name || 'Unknown'}
                                </Badge>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="h-7 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            title="Clear all filters"
                        >
                            <X className="mr-1 h-3 w-3" />
                            Clear all
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
