import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { Calendar, User } from 'lucide-react';

type Blog = {
    id: number;
    title: string;
    slug: string;
    author?: string | null;
    content?: string | null;
    featured_image?: string | null;
    published_at?: string | null;
};

type PageProps = { blog: Blog };

function formatLong(dateStr?: string | null) {
    if (!dateStr) return 'Date unknown';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
}

// Minimal markdown-ish rendering: preserve line breaks and basic paragraphs
function Content({ text }: { text: string | null | undefined }) {
    if (!text) return <p className="text-slate-500 dark:text-slate-400">No content available.</p>;
    const parts = text.split(/\n\n+/);
    return (
        <div className="prose prose-slate max-w-none dark:prose-invert">
            {parts.map((p, i) => (
                <p key={i}>{p}</p>
            ))}
        </div>
    );
}

export default function BlogShow() {
    const { props } = usePage<PageProps>();
    const { blog } = props;

    return (
        <MainLayout title={blog.title}>
            <div className="container mx-auto px-4 py-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="p-6 md:p-8">
                        <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">{blog.title}</h1>

                        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4" /> {formatLong(blog.published_at)}
                            </div>
                            {blog.author && (
                                <div className="flex items-center">
                                    <User className="mr-2 h-4 w-4" /> {blog.author}
                                </div>
                            )}
                        </div>

                        {blog.featured_image && (
                            <div className="mb-6 overflow-hidden rounded-lg">
                                <img src={blog.featured_image} alt={blog.title} className="h-auto w-full object-cover" loading="lazy" />
                            </div>
                        )}

                        <Separator className="my-6" />

                        <Content text={blog.content ?? ''} />

                        <div className="mt-8">
                            <Link href="/blogs" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                                ← Back to Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
