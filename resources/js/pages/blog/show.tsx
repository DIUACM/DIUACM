import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

type BlogPost = {
    id: number;
    title: string;
    slug: string;
    content: string;
    author: {
        name: string;
        username: string;
    };
    published_at: string;
    is_featured: boolean;
    featured_image_url?: string;
    reading_time: number;
};

type BlogShowPageProps = {
    blogPost: BlogPost;
};

export default function BlogShowPage({ blogPost }: BlogShowPageProps) {
    return (
        <MainLayout>
            <Head title={blogPost.title} />

            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/blog">
                        <Button variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blog
                        </Button>
                    </Link>
                </div>

                {/* Article */}
                <article className="max-w-4xl mx-auto">
                    {/* Featured Image */}
                    {blogPost.featured_image_url && (
                        <div className="relative mb-8 rounded-lg overflow-hidden">
                            <img
                                src={blogPost.featured_image_url}
                                alt={blogPost.title}
                                className="w-full h-64 md:h-96 object-cover"
                            />
                        </div>
                    )}

                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                            {blogPost.title}
                        </h1>
                        
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-4">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span>{blogPost.author.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{blogPost.published_at}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{blogPost.reading_time} min read</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <div 
                        className="prose prose-slate dark:prose-invert max-w-none prose-lg prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-code:text-blue-600 dark:prose-code:text-blue-400"
                        dangerouslySetInnerHTML={{ __html: blogPost.content }}
                    />
                </article>

                {/* Navigation back to blog */}
                <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <Link href="/blog">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            View All Posts
                        </Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}