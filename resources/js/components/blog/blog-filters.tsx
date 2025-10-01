import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useCallback, useState } from 'react';

type BlogFiltersProps = {
    filters: {
        search?: string;
    };
};

export function BlogFilters({ filters }: BlogFiltersProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const hasActiveFilters = !!(filters.search);

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

    const handleClearFilters = () => {
        setSearchQuery('');
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('page');
        router.visit(url.toString(), { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search blog posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button type="submit" variant="default" size="default">
                        Search
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="outline"
                            size="default"
                            onClick={handleClearFilters}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}