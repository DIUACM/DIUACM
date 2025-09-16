import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import MainLayout from '@/layouts/main-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Search as SearchIcon, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type BlogItem = {
    id: number;
    title: string;
    slug: string;
    author?: string | null;
    content?: string | null;
    featured_image?: string | null;
    published_at?: string | null;
};

type PageProps = {
    blogs: BlogItem[];
    pagination: { page: number; pages: number; total: number; limit: number };
    filters: { title?: string | null };
};

function formatDate(dateStr?: string | null) {
    if (!dateStr) return 'Date unknown';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

function BlogCard({ blog }: { blog: BlogItem }) {
    const content = blog.content ?? '';
    const excerpt = content.replace(/[#*`]/g, '').slice(0, 100) + (content.length > 100 ? '…' : '');

    return (
        <Link href={`/blogs/${blog.slug}`} prefetch="hover" className="block group">
            <Card className="overflow-hidden border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:hover:border-blue-600">
                <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <AspectRatio ratio={16 / 9} className="bg-slate-200 dark:bg-slate-700">
                        {/* simple image element to avoid next/image */}
                        <img
                            src={blog.featured_image ?? '/images/diuacm-logo-rounded.webp'}
                            alt={blog.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    </AspectRatio>
                </div>

                <CardContent className="p-4">
                    <h3 className="line-clamp-1 text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {blog.title}
                    </h3>
                    {excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{excerpt}</p>}
                </CardContent>

                <CardFooter className="flex items-center justify-between px-4 pb-4 pt-0 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(blog.published_at)}</span>
                    </div>

                    {blog.author && (
                        <Badge variant="outline" className="font-normal">
                            <User className="mr-1 h-3 w-3" />
                            {blog.author}
                        </Badge>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}

function Filters({ current }: { current: PageProps['filters'] }) {
    const [q, setQ] = useState<string>(current.title ?? '');
    const mounted = useRef(false);

    useEffect(() => {
        setQ(current.title ?? '');
    }, [current.title]);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        const id = setTimeout(() => {
            const data = q.trim() ? { title: q.trim() } : {};
            router.get('/blogs', data, {
                replace: true,
                preserveState: true,
                preserveScroll: true,
                only: ['blogs', 'pagination', 'filters'],
            });
        }, 400);
        return () => clearTimeout(id);
    }, [q]);

    return (
        <div className="mb-6">
            <div className="relative">
                <input
                    type="search"
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 pr-10 text-sm shadow-sm outline-none ring-0 transition-colors focus:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Search articles..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search blogs"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon className="h-4 w-4" />
                </span>
            </div>
        </div>
    );
}

export default function BlogIndex() {
    const { props } = usePage<PageProps>();
    const { blogs, pagination, filters } = props;

    return (
        <MainLayout title="Blog">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Our <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">Blog</span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">Read the latest articles, tutorials, and news from DIU ACM</p>
                </div>

                <Filters current={filters} />

                {blogs.length > 0 ? (
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {blogs.map((b) => (
                            <BlogCard key={b.id} blog={b} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <BookOpen className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No articles found</h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">There are no blog posts published yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
