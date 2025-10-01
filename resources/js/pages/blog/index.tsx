import { BlogCard, BlogListItem } from '@/components/blog/blog-card';
import { BlogFilters } from '@/components/blog/blog-filters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';

type PaginatedBlogs = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: BlogListItem[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

type BlogPageProps = {
    blogPosts: PaginatedBlogs;
    filters: {
        search?: string;
    };
};

export default function BlogPage({ blogPosts, filters }: BlogPageProps) {
    return (
        <MainLayout>
            <Head title="Blog" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Latest insights, tutorials, and updates from our team.</p>
                </div>

                <div className="mb-6">
                    <BlogFilters filters={filters} />
                </div>

                {blogPosts.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="mb-4 text-6xl">📝</div>
                        <p className="mb-2 text-lg text-slate-500">No blog posts found</p>
                        <p className="text-sm text-slate-400">
                            {filters.search ? 'Try adjusting your search to see more posts.' : 'There are no blog posts available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {blogPosts.data.map((blog) => (
                            <BlogCard key={blog.id} blog={blog} />
                        ))}
                    </div>
                )}

                {blogPosts.data.length > 0 && blogPosts.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={blogPosts.current_page} totalPages={blogPosts.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
